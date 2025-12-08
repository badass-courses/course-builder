import { db } from '@/db'
import { entitlements, entitlementTypes, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import { removeDiscordRole } from '@/lib/discord-utils'
import {
	createCohortEntitlement,
	createWorkshopEntitlement,
	EntitlementSourceType,
	getCreditEntitlementsForSourcePurchase,
} from '@/lib/entitlements'
import { createResourceEntitlements } from '@/lib/entitlements-query'
import { ensurePersonalOrganization } from '@/lib/personal-organization-service'
import { getWorkshop } from '@/lib/workshops-query'
import { log } from '@/server/logger'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import {
	PURCHASE_TRANSFERRED_API_EVENT,
	PURCHASE_TRANSFERRED_EVENT,
} from '@coursebuilder/core/inngest/purchase-transfer/event-purchase-transferred'

// Import shared configuration
import {
	gatherResourceContexts,
	getResourceData,
	PRODUCT_TYPE_CONFIG,
	ProductType,
	type ResourceContext,
} from '../config/product-types'

/**
 * Determine product type from product.type field
 */
const determineProductType = (product: any): ProductType | null => {
	// Use product.type directly for precise detection (aligned with post-purchase workflow)
	if (product.type === 'cohort') return 'cohort'
	if (product.type === 'self-paced') return 'self-paced'

	return null // Not a transferable product type
}

/**
 * Get product resource using unified approach
 */
const getProductResource = async (product: any, productType: ProductType) => {
	const config = PRODUCT_TYPE_CONFIG[productType]
	const resourceId = product.resources?.find(
		(resource: any) => resource.resource?.type === config.resourceType,
	)?.resource.id

	if (!resourceId) return null

	return await getResourceData(resourceId, productType)
}

/**
 * Remove entitlements from source user
 */
const removeEntitlementsFromSource = async (
	step: any,
	config: any,
	sourceUser: any,
	purchase: any,
	contentAccessEntitlementType: any,
	discordRoleEntitlementType: any,
) => {
	await step.run(`remove entitlements from source user`, async () => {
		// Soft delete all content access entitlements for this purchase
		await db
			.update(entitlements)
			.set({ deletedAt: new Date() })
			.where(
				and(
					eq(entitlements.userId, sourceUser.id),
					eq(entitlements.entitlementType, contentAccessEntitlementType.id),
					eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
					eq(entitlements.sourceId, purchase.id),
				),
			)

		// Soft delete all Discord role entitlements for this purchase
		if (discordRoleEntitlementType) {
			await db
				.update(entitlements)
				.set({ deletedAt: new Date() })
				.where(
					and(
						eq(entitlements.userId, sourceUser.id),
						eq(entitlements.entitlementType, discordRoleEntitlementType.id),
						eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
						eq(entitlements.sourceId, purchase.id),
					),
				)
		}

		log.info('Removed entitlements from source user', {
			sourceUserId: sourceUser.id,
			purchaseId: purchase.id,
			productType: config.logPrefix,
		})
	})
}

/**
 * Transfer coupon entitlements from source to target user
 * Uses eligibilityProductId in metadata to match entitlements to the purchase
 */
const transferCouponEntitlements = async (
	step: any,
	purchase: any,
	sourceUser: any,
	targetUser: any,
	targetOrganization: any,
	targetMembership: any,
) => {
	await step.run(`transfer coupon entitlements`, async () => {
		const couponEntitlements = await getCreditEntitlementsForSourcePurchase(
			purchase.productId,
			sourceUser.id,
		)

		const unusedEntitlements = couponEntitlements.filter(
			(entitlement) => !entitlement.deletedAt,
		)

		if (unusedEntitlements.length === 0) {
			log.info('No coupon entitlements to transfer', {
				purchaseId: purchase.id,
				productId: purchase.productId,
				sourceUserId: sourceUser.id,
			})
			return { transferred: 0 }
		}

		const couponCreditEntitlementType =
			await db.query.entitlementTypes.findFirst({
				where: eq(entitlementTypes.name, 'apply_special_credit'),
			})

		if (!couponCreditEntitlementType) {
			log.info('Coupon credit entitlement type not found, skipping transfer', {
				purchaseId: purchase.id,
			})
			return { transferred: 0 }
		}

		const sourceEntitlementIds = unusedEntitlements.map((e) => e.id)
		const createdEntitlementIds: string[] = []

		await db.transaction(async (tx) => {
			for (const sourceEntitlement of unusedEntitlements) {
				await tx
					.update(entitlements)
					.set({ deletedAt: new Date() })
					.where(eq(entitlements.id, sourceEntitlement.id))

				// Create new entitlement for target user with same coupon details
				const newEntitlementId = `${sourceEntitlement.sourceId}-${guid()}`
				await tx.insert(entitlements).values({
					id: newEntitlementId,
					userId: targetUser.id,
					organizationId: targetOrganization.id,
					organizationMembershipId: targetMembership.id,
					entitlementType: couponCreditEntitlementType.id,
					sourceType: EntitlementSourceType.COUPON,
					sourceId: sourceEntitlement.sourceId,
					metadata: sourceEntitlement.metadata,
				})

				createdEntitlementIds.push(newEntitlementId)
			}
		})

		log.info('Transferred coupon entitlements', {
			purchaseId: purchase.id,
			productId: purchase.productId,
			sourceUserId: sourceUser.id,
			targetUserId: targetUser.id,
			entitlementsTransferred: unusedEntitlements.length,
			sourceEntitlementIds,
			createdEntitlementIds,
		})

		return {
			transferred: unusedEntitlements.length,
			sourceEntitlementIds,
			createdEntitlementIds,
		}
	})
}

/**
 * Add entitlements to target user using shared function
 */
const addEntitlementsToTarget = async (
	step: any,
	productType: ProductType,
	config: any,
	params: {
		targetUser: any
		purchase: any
		resource: any
		targetOrganization: any
		targetMembership: any
		contentAccessEntitlementType: any
		discordRoleEntitlementType: any
		product: any
	},
) => {
	const {
		targetUser,
		purchase,
		resource,
		targetOrganization,
		targetMembership,
		contentAccessEntitlementType,
		discordRoleEntitlementType,
		product,
	} = params

	await step.run(`add entitlements to target user`, async () => {
		// Use shared createResourceEntitlements function
		const createdEntitlements = await createResourceEntitlements(
			productType,
			resource,
			{
				user: targetUser,
				purchase,
				organizationId: targetOrganization.id,
				orgMembership: targetMembership,
				contentAccessEntitlementType,
			},
		)

		// Add Discord role entitlement for the target user
		if (discordRoleEntitlementType) {
			const discordEntitlementId = `${resource.id}-discord-${guid()}`
			await config.createEntitlement({
				id: discordEntitlementId,
				userId: targetUser.id,
				organizationId: targetOrganization.id,
				organizationMembershipId: targetMembership.id,
				entitlementType: discordRoleEntitlementType.id,
				sourceType: EntitlementSourceType.PURCHASE,
				sourceId: purchase.id,
				metadata: {
					discordRoleId: config.getDiscordRoleId(product),
				},
			})
		}

		log.info('Added entitlements to target user', {
			targetUserId: targetUser.id,
			[`${config.logPrefix}Id`]: resource.id,
			purchaseId: purchase.id,
			entitlementsCreated: createdEntitlements.length,
		})

		return createdEntitlements
	})
}

/**
 * Transfer Discord role from source to target user
 */
const transferDiscordRole = async (
	step: any,
	productType: ProductType,
	config: any,
	product: any,
	sourceUser: any,
	targetUser: any,
	resource: any,
) => {
	// Remove from source user
	const discordRoleId = config.getDiscordRoleId(product)

	if (discordRoleId) {
		await step.run(`remove discord role from source user`, async () => {
			const result = await removeDiscordRole(sourceUser.id, discordRoleId)

			log.info('Removed Discord role from source user', {
				sourceUserId: sourceUser.id,
				[`${config.logPrefix}Id`]: resource.id,
				result,
			})

			return result
		})
	}

	// Add to target user via event (reuse pattern from post-purchase workflow)
	await step.sendEvent('send-discord-role-event', {
		name: config.discordEvent,
		data:
			productType === 'cohort'
				? {
						cohortId: resource.id,
						userId: targetUser.id,
						discordRoleId,
					}
				: {
						workshopId: resource.id,
						userId: targetUser.id,
						discordRoleId,
					},
	})
}

/**
 * Shared handler for purchase transfer entitlements management
 * This function handles the core logic for both UI and API transfers
 */
async function handleProductTransfer({
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

	// Determine product type and get configuration
	const productType = determineProductType(product)

	if (!productType) {
		// Not a transferable product type, log and return
		log.info('Transfer completed - not a transferable product type', {
			purchaseId: purchase.id,
			productId: product.id,
			productType: product.type,
			sourceUserId: event.data.sourceUserId,
			targetUserId: event.data.targetUserId,
			transferSource,
		})
		return {
			purchase,
			product,
			sourceUserId: event.data.sourceUserId,
			targetUserId: event.data.targetUserId,
			transferSource,
			message: 'Not a transferable product type',
		}
	}

	const config = PRODUCT_TYPE_CONFIG[productType]

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

	// Gather all resource contexts from the product
	const resourceContexts = await step.run(
		`gather all resource contexts`,
		async () => {
			return gatherResourceContexts(product, productType)
		},
	)

	if (resourceContexts.length === 0) {
		throw new Error(`No resources found for product`)
	}

	log.info('Resource contexts gathered', {
		resourceContextsCount: resourceContexts.length,
		resourceContexts: resourceContexts.map((ctx: ResourceContext) => ({
			resourceId: ctx.resourceId,
			resourceType: ctx.resourceType,
			productType: ctx.productType,
		})),
		transferSource,
	})

	// Load full resource data for each context
	const resourceDataMap = await step.run(
		`load resource data for all contexts`,
		async () => {
			const dataMap: Record<string, any> = {}
			for (const context of resourceContexts) {
				const resourceData = await getResourceData(
					context.resourceId,
					context.productType,
				)
				dataMap[context.resourceId] = resourceData
			}
			return dataMap
		},
	)

	const isTeamPurchase = Boolean(purchase.bulkCouponId)

	if (!isTeamPurchase && ['Valid', 'Restricted'].includes(purchase.status)) {
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

				// Ensure they have learner role
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

		// Find the primary resource context - this is REQUIRED for the transfer
		const primaryResourceContext = resourceContexts.find(
			(ctx: ResourceContext) => ctx.productType === productType,
		)

		// Validate that primary resource exists - critical for transfer to work
		if (!primaryResourceContext) {
			log.error('Primary resource context not found in product resources', {
				purchaseId: purchase.id,
				productId: product.id,
				productType,
				resourceContextsCount: resourceContexts.length,
				resourceContexts: resourceContexts.map((ctx: ResourceContext) => ({
					resourceId: ctx.resourceId,
					resourceType: ctx.resourceType,
					productType: ctx.productType,
				})),
				transferSource,
			})
			throw new Error(
				`Primary resource (${productType}) not found in product resources. Product may be misconfigured.`,
			)
		}

		const primaryResourceData =
			resourceDataMap[primaryResourceContext.resourceId]

		// Validate that primary resource data was loaded successfully
		if (!primaryResourceData) {
			log.error('Primary resource data not loaded', {
				purchaseId: purchase.id,
				productId: product.id,
				productType,
				primaryResourceContextId: primaryResourceContext.resourceId,
				transferSource,
			})
			throw new Error(
				`Primary resource data not found for resource ID: ${primaryResourceContext.resourceId}`,
			)
		}

		// Process primary resource (cohort) - includes Discord role transfer
		{
			const contentAccessEntitlementType = await step.run(
				`get ${config.logPrefix} content access entitlement type`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, config.contentAccess),
					})
				},
			)

			if (!contentAccessEntitlementType) {
				throw new Error(`Entitlement type not found: ${config.contentAccess}`)
			}

			const discordRoleEntitlementType = await step.run(
				`get ${config.logPrefix} discord role entitlement type`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, config.discordRole),
					})
				},
			)

			await removeEntitlementsFromSource(
				step,
				config,
				sourceUser,
				purchase,
				contentAccessEntitlementType,
				discordRoleEntitlementType,
			)

			await transferDiscordRole(
				step,
				productType,
				config,
				product,
				sourceUser,
				targetUser,
				primaryResourceData,
			)

			// Add entitlements to target user
			await addEntitlementsToTarget(step, productType, config, {
				targetUser,
				purchase,
				resource: primaryResourceData,
				targetOrganization: targetUserOrganization,
				targetMembership: targetUserOrgMembership,
				contentAccessEntitlementType,
				discordRoleEntitlementType,
				product,
			})
		}

		for (const context of resourceContexts) {
			// Skip primary resource - already handled above with Discord role transfer
			if (context.productType === productType) continue

			const resourceData = resourceDataMap[context.resourceId]
			if (!resourceData) continue

			const resourceConfig =
				PRODUCT_TYPE_CONFIG[
					context.productType as keyof typeof PRODUCT_TYPE_CONFIG
				]
			if (!resourceConfig) continue

			// Get entitlement types for this resource's product type
			const contentAccessEntitlementType = await step.run(
				`get ${resourceConfig.logPrefix} content access entitlement type for ${context.resourceId}`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, resourceConfig.contentAccess),
					})
				},
			)

			if (!contentAccessEntitlementType) {
				log.warn('Entitlement type not found, skipping resource', {
					resourceId: context.resourceId,
					entitlementTypeName: resourceConfig.contentAccess,
					transferSource,
				})
				continue
			}

			// Remove content access entitlements from source user for this resource
			await step.run(
				`remove ${resourceConfig.logPrefix} entitlements from source user for ${context.resourceId}`,
				async () => {
					await db
						.update(entitlements)
						.set({ deletedAt: new Date() })
						.where(
							and(
								eq(entitlements.userId, sourceUser.id),
								eq(
									entitlements.entitlementType,
									contentAccessEntitlementType.id,
								),
								eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
								eq(entitlements.sourceId, purchase.id),
							),
						)

					log.info('Removed entitlements from source user', {
						sourceUserId: sourceUser.id,
						purchaseId: purchase.id,
						productType: resourceConfig.logPrefix,
						resourceId: context.resourceId,
					})
				},
			)

			// Add entitlements to target user for this resource
			await addEntitlementsToTarget(step, context.productType, resourceConfig, {
				targetUser,
				purchase,
				resource: resourceData,
				targetOrganization: targetUserOrganization,
				targetMembership: targetUserOrgMembership,
				contentAccessEntitlementType,
				discordRoleEntitlementType: null, // Discord roles handled separately for primary resource only
				product: context.productForResource || product,
			})
		}

		// Transfer coupon entitlements from source to target user
		// Uses eligibilityProductId in metadata to match entitlements to this purchase
		await transferCouponEntitlements(
			step,
			purchase,
			sourceUser,
			targetUser,
			targetUserOrganization,
			targetUserOrgMembership,
		)
	}

	// Log successful completion
	await step.run(`log transfer completed`, async () => {
		log.info('Transfer completed successfully', {
			purchaseId: purchase.id,
			sourceUserId: sourceUser.id,
			targetUserId: targetUser.id,
			resourceContextsCount: resourceContexts.length,
			productId: product.id,
			transferSource,
		})
	})

	return {
		purchase,
		product,
		sourceUser,
		targetUser,
		resourceContexts,
		isTeamPurchase,
		transferSource,
	}
}

/**
 * Workflow for UI-initiated transfers
 */
export const productTransferWorkflow = inngest.createFunction(
	{
		id: `product-transfer-workflow`,
		name: `Product Transfer Workflow`,
	},
	{
		event: PURCHASE_TRANSFERRED_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		return handleProductTransfer({
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
export const apiProductTransferWorkflow = inngest.createFunction(
	{
		id: `api-product-transfer-workflow`,
		name: `API Product Transfer Workflow`,
	},
	{
		event: PURCHASE_TRANSFERRED_API_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		return handleProductTransfer({
			event,
			step,
			db: adapter,
			transferSource: 'api',
		})
	},
)

// Export legacy function names for backwards compatibility
export const cohortTransferWorkflow = productTransferWorkflow
export const workshopTransferWorkflow = productTransferWorkflow
export const apiTransferWorkflow = apiProductTransferWorkflow
