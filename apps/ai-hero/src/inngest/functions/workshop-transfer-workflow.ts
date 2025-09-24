import { db } from '@/db'
import { entitlements, entitlementTypes, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { removeDiscordRole } from '@/lib/discord-utils'
import {
	createWorkshopEntitlement,
	EntitlementSourceType,
} from '@/lib/entitlements'
import { ensurePersonalOrganization } from '@/lib/personal-organization-service'
import { getWorkshop } from '@/lib/workshops-query'
import { log } from '@/server/logger'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import {
	PURCHASE_TRANSFERRED_API_EVENT,
	PURCHASE_TRANSFERRED_EVENT,
} from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'

import { USER_ADDED_TO_WORKSHOP_EVENT } from './discord/add-workshop-role-discord'

/**
 * Shared handler for purchase transfer entitlements management
 * This function handles the core logic for both UI and API transfers
 */
async function handleTransferEntitlements({
	event,
	step,
	db: adapter,
	transferSource,
}: {
	event: any
	step: any
	db: any
	transferSource: 'ui' | 'api'
}) {
	// Log the transfer initiation
	await step.run(`log transfer initiated`, async () => {
		log.info('Purchase transfer initiated', {
			purchaseId: event.data.purchaseId,
			sourceUserId: event.data.sourceUserId,
			targetUserId: event.data.targetUserId,
			transferSource,
		})
	})

	const purchase = await step.run(`get purchase`, async () => {
		return adapter.getPurchase(event.data.purchaseId)
	})

	if (!purchase) {
		throw new Error('Purchase not found')
	}

	log.info('Purchase transfer details', {
		id: purchase.id,
		organizationId: purchase.organizationId,
		productId: purchase.productId,
		userId: purchase.userId,
		status: purchase.status,
		transferSource,
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
	const workshopResourceId = product.resources?.find(
		(resource: any) => resource.resource?.type === 'workshop',
	)?.resource.id

	if (!workshopResourceId) {
		// Not a cohort product, log and return
		log.info('Transfer completed - not a workshop product', {
			purchaseId: purchase.id,
			productId: product.id,
			sourceUserId: sourceUser.id,
			targetUserId: targetUser.id,
			transferSource,
		})
		return {
			purchase,
			product,
			sourceUser,
			targetUser,
			isTeamPurchase: false,
			transferSource,
		}
	}

	const workshopResource = await step.run(`get workshop resource`, async () => {
		return getWorkshop(workshopResourceId)
	})

	if (!workshopResource) {
		throw new Error('Workshop resource not found')
	}

	log.info('Workshop resource details', {
		id: workshopResource.id,
		title: workshopResource.fields?.title,
		organizationId: workshopResource.organizationId,
		resourceCount: workshopResource.resources?.length,
		transferSource,
	})

	const isTeamPurchase = Boolean(purchase.bulkCouponId)

	if (!isTeamPurchase && ['Valid', 'Restricted'].includes(purchase.status)) {
		const workshopContentAccessEntitlementType = await step.run(
			`get workshop content access entitlement type`,
			async () => {
				return await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'workshop_content_access'),
				})
			},
		)

		const workshopDiscordRoleEntitlementType = await step.run(
			`get workshop discord role entitlement type`,
			async () => {
				return await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'workshop_discord_role'),
				})
			},
		)

		// Remove entitlements from source user
		await step.run(`remove entitlements from source user`, async () => {
			if (
				!workshopContentAccessEntitlementType ||
				!workshopResource?.resources
			) {
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
							workshopContentAccessEntitlementType.id,
						),
						eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
						eq(entitlements.sourceId, purchase.id),
					),
				)

			// Soft delete all Discord role entitlements for this purchase
			if (workshopDiscordRoleEntitlementType) {
				await db
					.update(entitlements)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(entitlements.userId, sourceUser.id),
							eq(
								entitlements.entitlementType,
								workshopDiscordRoleEntitlementType.id,
							),
							eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
							eq(entitlements.sourceId, purchase.id),
						),
					)
			}

			log.info('Removed entitlements from source user', {
				sourceUserId: sourceUser.id,
				purchaseId: purchase.id,
				workshopId: workshopResource.id,
				transferSource,
			})
		})

		// Remove Discord role from source user
		await step.run(`remove discord role from source user`, async () => {
			// Check if Discord role ID is configured
			if (!env.DISCORD_PURCHASER_ROLE_ID) {
				log.warn('Discord workshop role ID not configured', {
					sourceUserId: sourceUser.id,
					workshopId: workshopResource.id,
					transferSource,
				})
				return {
					status: 'error',
					reason: 'Discord workshop role ID not configured',
					sourceUserId: sourceUser.id,
				}
			}

			// Remove the cohort role from Discord using utility function
			const result = await removeDiscordRole(
				sourceUser.id,
				env.DISCORD_PURCHASER_ROLE_ID,
			)

			log.info('Removed Discord role from source user', {
				sourceUserId: sourceUser.id,
				workshopId: workshopResource.id,
				result,
				transferSource,
			})

			return {
				...result,
				sourceUserId: sourceUser.id,
				workshopId: workshopResource.id,
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

			log.info('Moved purchase to target user organization', {
				purchaseId: purchase.id,
				fromOrganizationId: purchase.organizationId,
				toOrganizationId: targetUserOrganization.id,
				targetUserId: targetUser.id,
				transferSource,
			})
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
					(m: any) => m.organizationId === targetUserOrganization.id,
				)

				if (!membership) {
					throw new Error(
						'Target user not found in their personal organization',
					)
				}

				log.info('Found target user membership', {
					membership,
					transferSource,
				})

				// Ensure they have learner role for cohort access
				try {
					await adapter.addRoleForMember({
						organizationId: targetUserOrganization.id,
						memberId: membership.id,
						role: 'learner',
					})
					log.info('Added learner role to target user', { transferSource })
				} catch (error: any) {
					if (error.message?.includes('duplicate') || error.code === 'P2002') {
						log.info('Learner role already exists for target user', {
							transferSource,
						})
					} else {
						// Re-throw unexpected errors
						log.error('Failed to add learner role', { error, transferSource })
						throw new Error(`Failed to add learner role: ${error.message}`)
					}
				}

				return membership
			},
		)

		// Add entitlements to target user in their organization
		await step.run(`add entitlements to target user`, async () => {
			if (!workshopContentAccessEntitlementType || !workshopResource) {
				return
			}

			await createWorkshopEntitlement({
				resourceId: workshopResource.id,
				entitlementType: workshopContentAccessEntitlementType.id,
				userId: targetUser.id,
				organizationId: targetUserOrganization.id,
				organizationMembershipId: targetUserOrgMembership.id,
				sourceType: EntitlementSourceType.PURCHASE,
				sourceId: purchase.id,
				metadata: {
					contentIds: [workshopResource.id],
				},
			})

			// Add Discord role entitlement for the target user
			if (workshopDiscordRoleEntitlementType) {
				const discordEntitlementId = `${workshopResource.id}-discord-${guid()}`
				await createWorkshopEntitlement({
					id: discordEntitlementId,
					userId: targetUser.id,
					organizationId: targetUserOrganization.id,
					organizationMembershipId: targetUserOrgMembership.id,
					entitlementType: workshopDiscordRoleEntitlementType.id,
					sourceType: EntitlementSourceType.PURCHASE,
					sourceId: purchase.id,
					metadata: {
						discordRoleId: env.DISCORD_PURCHASER_ROLE_ID,
					},
				})
			}

			log.info('Added entitlements to target user', {
				targetUserId: targetUser.id,
				workshopId: workshopResource.id,
				purchaseId: purchase.id,
				transferSource,
			})
		})

		// trigger the Discord role event
		await step.sendEvent('send-discord-role-event', {
			name: USER_ADDED_TO_WORKSHOP_EVENT,
			data: {
				workshopId: workshopResource.id,
				userId: targetUser.id,
				discordRoleId: env.DISCORD_PURCHASER_ROLE_ID,
			},
		})
	}

	// Log successful completion
	await step.run(`log transfer completed`, async () => {
		log.info('Transfer completed successfully', {
			purchaseId: purchase.id,
			sourceUserId: sourceUser.id,
			targetUserId: targetUser.id,
			workshopId: workshopResource?.id,
			productId: product.id,
			transferSource,
		})
	})

	return {
		purchase,
		product,
		sourceUser,
		targetUser,
		workshopResource,
		isTeamPurchase,
		transferSource,
	}
}

/**
 * Workflow for UI-initiated transfers
 */
export const workshopTransferWorkflow = inngest.createFunction(
	{
		id: `workshop-transfer-workflow`,
		name: `Workshop Transfer Workflow`,
	},

	{
		event: PURCHASE_TRANSFERRED_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		return handleTransferEntitlements({
			event,
			step,
			db: adapter,
			transferSource: 'ui',
		})
	},
)

/**
 * Workflow for API-initiated transfers
 */
export const apiWorkshopTransferWorkflow = inngest.createFunction(
	{
		id: `api-workshop-transfer-workflow`,
		name: `API Workshop Transfer Workflow`,
	},

	{
		event: PURCHASE_TRANSFERRED_API_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		return handleTransferEntitlements({
			event,
			step,
			db: adapter,
			transferSource: 'api',
		})
	},
)
