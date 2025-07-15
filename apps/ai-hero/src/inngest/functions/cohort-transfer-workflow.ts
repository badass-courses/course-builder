import { db } from '@/db'
import { entitlements, entitlementTypes, purchases } from '@/db/schema'
import { env } from '@/env'
import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import { createCohortEntitlement } from '@/lib/entitlements'
import { ensurePersonalOrganization } from '@/lib/personal-organization-service'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { PURCHASE_TRANSFERRED_EVENT } from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'

import { USER_ADDED_TO_COHORT_EVENT } from './discord/add-cohort-role-discord'

export const cohortTransferWorkflow = inngest.createFunction(
	{
		id: `cohort-transfer-workflow`,
		name: `Cohort Transfer Workflow`,
	},

	{
		event: PURCHASE_TRANSFERRED_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		const purchase = await step.run(`get purchase`, async () => {
			return adapter.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error('Purchase not found')
		}

		console.log('Purchase details:', {
			id: purchase.id,
			organizationId: purchase.organizationId,
			productId: purchase.productId,
			userId: purchase.userId,
			status: purchase.status,
		})

		const product = await step.run(`get product`, async () => {
			return adapter.getProduct(purchase.productId as string)
		})

		if (!product) {
			throw new Error('Product not found')
		}

		const sourceUser = await step.run(`get source user`, async () => {
			return adapter.getUserById(event.data.sourceUserId)
		})

		const targetUser = await step.run(`get target user`, async () => {
			return adapter.getUserById(event.data.targetUserId)
		})

		if (!sourceUser || !targetUser) {
			throw new Error('Source or target user not found')
		}

		if (sourceUser.id === targetUser.id) {
			throw new Error('Source and target users cannot be the same')
		}

		// Check if this is a cohort product
		const cohortResourceId = product.resources?.find(
			(resource) => resource.resource?.type === 'cohort',
		)?.resource.id

		if (!cohortResourceId) {
			// Not a cohort product, nothing to do
			return {
				purchase,
				product,
				sourceUser,
				targetUser,
				isTeamPurchase: false,
			}
		}

		const cohortResource = await step.run(`get cohort resource`, async () => {
			return getCohort(cohortResourceId)
		})

		if (!cohortResource) {
			throw new Error('Cohort resource not found')
		}

		console.log('Cohort resource details:', {
			id: cohortResource.id,
			title: cohortResource.fields?.title,
			organizationId: cohortResource.organizationId,
			resourceCount: cohortResource.resources?.length,
		})

		const isTeamPurchase = Boolean(purchase.bulkCouponId)

		if (!isTeamPurchase && ['Valid', 'Restricted'].includes(purchase.status)) {
			const cohortContentAccessEntitlementType = await step.run(
				`get cohort content access entitlement type`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, 'cohort_content_access'),
					})
				},
			)

			const cohortDiscordRoleEntitlementType = await step.run(
				`get cohort discord role entitlement type`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, 'cohort_discord_role'),
					})
				},
			)

			// Remove entitlements from source user
			await step.run(`remove entitlements from source user`, async () => {
				if (!cohortContentAccessEntitlementType || !cohortResource?.resources) {
					return
				}

				// Soft delete all content access entitlements for this purchase
				await db
					.update(entitlements)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(entitlements.userId, sourceUser.id),
							eq(
								entitlements.entitlementType,
								cohortContentAccessEntitlementType.id,
							),
							eq(entitlements.sourceType, 'PURCHASE'),
							eq(entitlements.sourceId, purchase.id),
						),
					)

				// Soft delete all Discord role entitlements for this purchase
				if (cohortDiscordRoleEntitlementType) {
					await db
						.update(entitlements)
						.set({ deletedAt: new Date() })
						.where(
							and(
								eq(entitlements.userId, sourceUser.id),
								eq(
									entitlements.entitlementType,
									cohortDiscordRoleEntitlementType.id,
								),
								eq(entitlements.sourceType, 'PURCHASE'),
								eq(entitlements.sourceId, purchase.id),
							),
						)
				}
			})

			// Get target user's personal organization
			const targetUserOrganization = await step.run(
				`get target user personal organization`,
				async () => {
					const result = await ensurePersonalOrganization(targetUser, adapter)
					return result.organization
				},
			)

			// Move the purchase to target user's organization
			await step.run(`move purchase to target user organization`, async () => {
				await db
					.update(purchases)
					.set({ organizationId: targetUserOrganization.id })
					.where(eq(purchases.id, purchase.id))

				console.log(
					'Moved purchase from',
					purchase.organizationId,
					'to',
					targetUserOrganization.id,
				)
			})

			// Ensure source user still has a valid personal organization
			await step.run(`ensure source user organization integrity`, async () => {
				await ensurePersonalOrganization(sourceUser, adapter)
			})

			// Get target user's membership in their personal org
			const targetUserOrgMembership = await step.run(
				`get target user org membership`,
				async () => {
					const targetMemberships = await adapter.getMembershipsForUser(
						targetUser.id,
					)
					const membership = targetMemberships.find(
						(m) => m.organizationId === targetUserOrganization.id,
					)

					if (!membership) {
						throw new Error(
							'Target user not found in their personal organization',
						)
					}

					console.log('Found target user membership:', membership)

					// Ensure they have learner role for cohort access
					try {
						await adapter.addRoleForMember({
							organizationId: targetUserOrganization.id,
							memberId: membership.id,
							role: 'learner',
						})
						console.log('Added learner role to target user')
					} catch (error: any) {
						if (
							error.message?.includes('duplicate') ||
							error.code === 'P2002'
						) {
							console.log('Learner role already exists for target user')
						} else {
							// Re-throw unexpected errors
							console.error('Failed to add learner role:', error)
							throw new Error(`Failed to add learner role: ${error.message}`)
						}
					}

					return membership
				},
			)

			// Add entitlements to target user in their organization
			await step.run(`add entitlements to target user`, async () => {
				if (!cohortContentAccessEntitlementType || !cohortResource?.resources) {
					return
				}

				for (const resource of cohortResource.resources || []) {
					await createCohortEntitlement({
						resourceId: resource.resource.id,
						entitlementType: cohortContentAccessEntitlementType.id,
						userId: targetUser.id,
						organizationId: targetUserOrganization.id,
						organizationMembershipId: targetUserOrgMembership.id,
						sourceType: 'PURCHASE',
						sourceId: purchase.id,
						metadata: {
							contentIds: [resource.resource.id],
						},
					})
				}

				// Add Discord role entitlement for the target user
				if (cohortDiscordRoleEntitlementType) {
					const discordEntitlementId = `${cohortResource.id}-discord-${guid()}`
					await createCohortEntitlement({
						id: discordEntitlementId,
						userId: targetUser.id,
						organizationId: targetUserOrganization.id,
						organizationMembershipId: targetUserOrgMembership.id,
						entitlementType: cohortDiscordRoleEntitlementType.id,
						sourceType: 'PURCHASE',
						sourceId: purchase.id,
						metadata: {
							discordRoleId: env.DISCORD_COHORT_001_ROLE_ID,
						},
					})
				}

				console.log(
					'Added entitlements to target user in their personal organization',
				)
			})

			// trigger the Discord role event
			await step.sendEvent('send-discord-role-event', {
				name: USER_ADDED_TO_COHORT_EVENT,
				data: {
					cohortId: cohortResource.id,
					userId: targetUser.id,
					discordRoleId: env.DISCORD_COHORT_001_ROLE_ID,
				},
			})
		}

		return {
			purchase,
			product,
			sourceUser,
			targetUser,
			cohortResource,
			isTeamPurchase,
		}
	},
)
