import { db } from '@/db'
import { entitlements, entitlementTypes, purchases } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import { and, eq, sql } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { PURCHASE_TRANSFERRED_EVENT } from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'

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
			return { purchase, product, sourceUser, targetUser }
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

			// Remove entitlements from source user
			await step.run(`remove entitlements from source user`, async () => {
				if (!cohortContentAccessEntitlementType || !cohortResource?.resources) {
					return
				}

				for (const resource of cohortResource.resources) {
					await db
						.delete(entitlements)
						.where(
							and(
								eq(entitlements.userId, sourceUser.id),
								eq(
									entitlements.entitlementType,
									cohortContentAccessEntitlementType.id,
								),
								eq(entitlements.sourceType, 'cohort'),
								eq(entitlements.sourceId, resource.resource.id),
							),
						)
				}
			})

			// Get target user's personal organization
			const targetUserOrganization = await step.run(
				`get target user personal organization`,
				async () => {
					const targetMemberships = await adapter.getMembershipsForUser(
						targetUser.id,
					)

					if (targetMemberships.length === 0) {
						throw new Error('Target user has no personal organization')
					}

					// Find their personal organization
					const expectedOrgName = `Personal (${targetUser.email})`
					const personalOrg = targetMemberships.find(
						(membership) => membership.organization.name === expectedOrgName,
					)?.organization

					if (!personalOrg) {
						// Use the first organization as fallback (should be personal)
						const firstOrg = targetMemberships[0]?.organization
						if (!firstOrg) {
							throw new Error('Target user has no valid organization')
						}
						return firstOrg
					}

					return personalOrg
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
				const sourceMemberships = await adapter.getMembershipsForUser(
					sourceUser.id,
				)

				// Check if source user still has their personal organization
				const expectedSourceOrgName = `Personal (${sourceUser.email})`
				const hasPersonalOrg = sourceMemberships.some(
					(membership) =>
						membership.organization.name === expectedSourceOrgName,
				)

				if (!hasPersonalOrg) {
					// Create a new personal organization for source user
					console.log('Creating new personal organization for source user')
					const newPersonalOrg = await adapter.createOrganization({
						name: `Personal (${sourceUser.email})`,
					})

					if (!newPersonalOrg) {
						throw new Error(
							'Failed to create personal organization for source user',
						)
					}

					// Add source user to their new personal organization as owner
					const membership = await adapter.addMemberToOrganization({
						organizationId: newPersonalOrg.id,
						userId: sourceUser.id,
						invitedById: sourceUser.id,
					})

					if (!membership) {
						throw new Error(
							'Failed to add source user to their personal organization',
						)
					}

					await adapter.addRoleForMember({
						organizationId: newPersonalOrg.id,
						memberId: membership.id,
						role: 'owner',
					})

					console.log(
						'Created new personal organization for source user:',
						newPersonalOrg.id,
					)
				} else {
					console.log('Source user personal organization is intact')
				}
			})

			// Get target user's membership in their personal org
			const orgMembership = await step.run(
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

				const resourceIds = cohortResource.resources.map((r) => r.resource.id)
				await db
					.delete(entitlements)
					.where(
						and(
							eq(entitlements.userId, sourceUser.id),
							eq(
								entitlements.entitlementType,
								cohortContentAccessEntitlementType.id,
							),
							eq(entitlements.sourceType, 'cohort'),
							sql`${entitlements.sourceId} IN (${sql.join(resourceIds, sql`, `)})`,
						),
					)

				console.log(
					'Added entitlements to target user in their personal organization',
				)
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
