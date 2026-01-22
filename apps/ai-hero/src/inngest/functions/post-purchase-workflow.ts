import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { entitlements, entitlementTypes } from '@/db/schema'
import LiveOfficeHoursInvitation, {
	generateICSAttachments,
} from '@/emails/live-office-hours-invitation'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getCohortWelcomeEmailVariant } from '@/inngest/utils/get-cohort-welcome-email-variant'
import { getWorkshopWelcomeEmailVariant } from '@/inngest/utils/get-workshop-welcome-email-variant'
import { EntitlementSourceType } from '@/lib/entitlements'
import { createResourceEntitlements } from '@/lib/entitlements-query'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { createShortlinkAttribution } from '@/lib/shortlinks-query'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { isAfter, parse } from 'date-fns'
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { FULL_PRICE_COUPON_REDEEMED_EVENT } from '@coursebuilder/core/inngest/commerce/event-full-price-coupon-redeemed'
import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'
import {
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

// Import shared configuration and utilities
import {
	ENTITLEMENT_CONFIG,
	gatherResourceContexts,
	getDiscordRoleId,
	getResourceData,
	PRODUCT_TYPE_CONFIG,
	ProductType,
	type ResourceContext,
} from '../config/product-types'
import { GRANT_COUPON_ENTITLEMENTS_FOR_PURCHASE_EVENT } from '../events/grant-coupon-entitlements-for-purchase'
import {
	USER_ADDED_TO_COHORT_EVENT,
	USER_ADDED_TO_WORKSHOP_EVENT,
} from './discord/add-discord-role-workflow'

/**
 * Generate content URL based on product type and resource
 */
export const generateContentUrl = (
	resource: ContentResource,
	productType: ProductType,
	dayOneUnlockDate?: string | null,
) => {
	if (productType === 'cohort') {
		const isKnownDate = !!dayOneUnlockDate && dayOneUnlockDate !== 'TBD'
		const dayOneIsInFuture =
			isKnownDate &&
			dayOneUnlockDate &&
			isAfter(
				zonedTimeToUtc(
					parse(dayOneUnlockDate, 'MMMM do, yyyy', new Date()),
					'America/Los_Angeles',
				),
				new Date(),
			)

		if (!dayOneIsInFuture) {
			// Find the day one workshop (position 0) for immediate access
			const dayOneWorkshop = resource.resources?.find(
				(r: any) => r.position === 0,
			)?.resource

			if (dayOneWorkshop) {
				return (
					env.NEXT_PUBLIC_URL +
					getResourcePath('workshop', dayOneWorkshop.fields?.slug, 'view')
				)
			}
		}

		// Fallback: use cohort's own resource path
		return (
			env.NEXT_PUBLIC_URL +
			getResourcePath(resource.type, resource.fields?.slug, 'view')
		)
	} else {
		return (
			env.NEXT_PUBLIC_URL +
			getResourcePath(resource.type, resource.fields?.slug, 'view')
		)
	}
}

/**
 * Unified Post-Purchase Workflow
 * Handles both cohort and workshop purchases with shared logic
 */
export const postPurchaseWorkflow = inngest.createFunction(
	{
		id: `post-purchase-workflow`,
		name: `Post Purchase Followup Workflow`,
		idempotency: 'event.data.purchaseId',
	},
	[
		{
			event: NEW_PURCHASE_CREATED_EVENT,
			if: 'event.data.productType == "cohort" || event.data.productType == "self-paced"',
		},
		{
			event: FULL_PRICE_COUPON_REDEEMED_EVENT,
			if: 'event.data.productType == "cohort" || event.data.productType == "self-paced"',
		},
	],
	async ({ event, step, db: adapter, paymentProvider }) => {
		const productType = event.data.productType as ProductType
		const entitlementConfig = ENTITLEMENT_CONFIG[productType]

		if (!entitlementConfig) {
			throw new Error(`Unsupported product type: ${productType}`)
		}

		// Step 1: Get purchase data
		const purchase = await step.run(`get purchase`, async () => {
			return adapter.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error(`purchase not found`)
		}

		// Step 2: Get product data
		const product = await step.run(`get product`, async () => {
			return adapter.getProduct(purchase.productId as string)
		})

		if (!product) {
			throw new Error(`product not found`)
		}

		// Step 3: Get user data
		const user = await step.run(`get user`, async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		// Step 4: Determine purchase characteristics
		const isTeamPurchase = Boolean(purchase.bulkCouponId)
		const isFullPriceCouponRedemption = Boolean(purchase.redeemedBulkCouponId)

		// Step 4.5: Record shortlink attribution if present
		await step.run('record shortlink attribution', async () => {
			// Only process shortlink attribution for NEW_PURCHASE_CREATED_EVENT
			// (not for full-price coupon redemptions)
			if (event.name !== NEW_PURCHASE_CREATED_EVENT) {
				return { skipped: true, reason: 'Not a new purchase event' }
			}

			const checkoutSessionId = event.data.checkoutSessionId
			if (!checkoutSessionId || !paymentProvider) {
				return {
					skipped: true,
					reason: 'No checkout session or payment provider',
				}
			}

			try {
				const checkoutSession =
					await paymentProvider.options.paymentsAdapter.getCheckoutSession(
						checkoutSessionId,
					)

				const shortlinkRef = checkoutSession.metadata?.shortlinkRef

				if (!shortlinkRef) {
					await log.info('shortlink.attribution.no_ref_in_metadata', {
						checkoutSessionId,
						purchaseId: purchase.id,
						productId: product.id,
						metadata: checkoutSession.metadata,
					})
					return { skipped: true, reason: 'No shortlink reference in metadata' }
				}

				await log.info('shortlink.attribution.found_ref', {
					checkoutSessionId,
					shortlinkRef,
					purchaseId: purchase.id,
					productId: product.id,
				})

				// Record the attribution
				await createShortlinkAttribution({
					shortlinkSlug: shortlinkRef,
					email: user.email,
					userId: user.id,
					type: 'purchase',
					metadata: {
						productId: product.id,
						productName: product.name,
						purchaseId: purchase.id,
						totalAmount: purchase.totalAmount,
					},
				})

				return {
					recorded: true,
					shortlinkRef,
					userId: user.id,
					email: user.email,
				}
			} catch (error: any) {
				await log.warn('shortlink.attribution.checkout_session_error', {
					checkoutSessionId,
					purchaseId: purchase.id,
					error: error.message,
				})
				return { error: error.message }
			}
		})

		// Step 5: Grant coupon-based entitlements for new purchase
		await step.sendEvent('grant coupon entitlements for purchase', {
			name: GRANT_COUPON_ENTITLEMENTS_FOR_PURCHASE_EVENT,
			data: {
				purchaseId: purchase.id,
				userId: purchase.userId || user.id,
				productId: purchase.productId,
				purchaseStatus: purchase.status,
				totalAmount: purchase.totalAmount,
				bulkCouponId: purchase.bulkCouponId,
			},
		})

		// Step 6: Mark entitlement-based coupons as used (set deletedAt) if they were used in this checkout
		// Note: Entitlement coupons are only used in real Stripe checkout sessions (NEW_PURCHASE_CREATED_EVENT).
		// Full-price coupon redemptions (FULL_PRICE_COUPON_REDEEMED_EVENT) don't use entitlement coupons.
		await step.run('mark entitlement coupons as used', async () => {
			if (event.name === FULL_PRICE_COUPON_REDEEMED_EVENT) {
				return {
					marked: 0,
					reason: 'Coupon redemption - no entitlement coupons to process',
				}
			}

			const checkoutSessionId = event.data.checkoutSessionId
			if (!checkoutSessionId || !purchase.userId) {
				return { marked: 0, reason: 'No checkout session ID or user ID' }
			}

			if (!paymentProvider) {
				return { marked: 0, reason: 'No payment provider available' }
			}

			let checkoutSession
			try {
				checkoutSession =
					await paymentProvider.options.paymentsAdapter.getCheckoutSession(
						checkoutSessionId,
					)
			} catch (error: any) {
				await log.warn('checkout.session.not_found', {
					checkoutSessionId,
					purchaseId: purchase.id,
					userId: purchase.userId,
					eventName: event.name,
					error: error.message,
				})
				return {
					marked: 0,
					reason: 'Checkout session not found',
				}
			}

			const usedEntitlementCouponIds =
				checkoutSession.metadata?.usedEntitlementCouponIds

			if (!usedEntitlementCouponIds) {
				return { marked: 0, reason: 'No entitlement coupons used' }
			}

			const couponIds = usedEntitlementCouponIds
				.split(',')
				.map((id) => id.trim())
				.filter((id) => id.length > 0)

			if (couponIds.length === 0) {
				return { marked: 0, reason: 'No valid coupon IDs' }
			}

			const specialCreditEntitlementType =
				await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'apply_special_credit'),
				})

			if (!specialCreditEntitlementType) {
				return { marked: 0, reason: 'Entitlement type not found' }
			}

			const result = await db
				.update(entitlements)
				.set({ deletedAt: new Date() })
				.where(
					and(
						eq(entitlements.userId, purchase.userId),
						eq(entitlements.entitlementType, specialCreditEntitlementType.id),
						eq(entitlements.sourceType, EntitlementSourceType.COUPON),
						sql`${entitlements.sourceId} IN (${sql.join(
							couponIds.map((id) => sql`${id}`),
							sql`, `,
						)})`,
						isNull(entitlements.deletedAt),
					),
				)

			return {
				marked: result.rowsAffected || 0,
				couponIds,
			}
		})

		// Step 7: Get bulk coupon data if needed
		const bulkCouponData = await step.run(`get bulk coupon data`, async () => {
			if (isFullPriceCouponRedemption && purchase.redeemedBulkCouponId) {
				const couponWithBulkPurchases =
					await adapter.getCouponWithBulkPurchases(
						purchase.redeemedBulkCouponId,
					)

				// The original bulk purchase should be in the bulkPurchases array
				const originalBulkPurchase = couponWithBulkPurchases?.bulkPurchases?.[0]

				return {
					coupon: couponWithBulkPurchases,
					originalBulkPurchase,
				}
			}
			return null
		})

		// Step 8: Gather all resource contexts from the product
		const resourceContexts = await step.run(
			`gather all resource contexts`,
			async () => {
				return gatherResourceContexts(product, productType)
			},
		)

		if (resourceContexts.length === 0) {
			throw new Error(`No resources found for product`)
		}

		// Step 9: Load full resource data for each context
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

		// Step 10: Handle team purchases
		if (isTeamPurchase) {
			const bulkCoupon = await step.run('get bulk coupon', async () => {
				if (purchase.bulkCouponId) {
					return adapter.getCoupon(purchase.bulkCouponId)
				}
				return null
			})

			// Send welcome email for each resource context
			for (const context of resourceContexts) {
				const resourceData = resourceDataMap[context.resourceId]
				if (!resourceData) continue

				const resourceConfig = PRODUCT_TYPE_CONFIG[context.productType]
				if (!resourceConfig) continue

				await step.run(
					`send welcome email to team purchaser for ${context.resourceType}`,
					async () => {
						const parsedResource = ContentResourceSchema.parse(resourceData)
						const contentUrl = generateContentUrl(
							parsedResource,
							context.productType,
							context.dayOneUnlockDate,
						)

						if (context.productType === 'cohort') {
							const ComponentToSend = getCohortWelcomeEmailVariant({
								isTeamPurchase: true,
								isFullPriceCouponRedemption,
							})

							await sendAnEmail({
								Component: ComponentToSend,
								componentProps: {
									cohortTitle:
										parsedResource.fields?.title || parsedResource.fields?.slug,
									url: contentUrl,
									dayOneUnlockDate: context.dayOneUnlockDate || 'TBD',
									quantity: bulkCoupon?.maxUses || 1,
									userFirstName: user.name?.split(' ')[0],
								},
								Subject: `Welcome to ${parsedResource.fields?.title || config.defaultTitle}!`,
								To: user.email,
								ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
								From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
								type: 'transactional',
							})
						} else {
							const ComponentToSend = getWorkshopWelcomeEmailVariant({
								isTeamPurchase: true,
								isFullPriceCouponRedemption,
							})

							await sendAnEmail({
								Component: ComponentToSend,
								componentProps: {
									workshopTitle:
										parsedResource.fields?.title || parsedResource.fields?.slug,
									url: contentUrl,
									quantity: bulkCoupon?.maxUses || 1,
									userFirstName: user.name?.split(' ')[0],
								},
								Subject: `Welcome to ${parsedResource.fields?.title || config.defaultTitle}!`,
								To: user.email,
								ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
								From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
								type: 'transactional',
							})
						}

						await log.info(`${resourceConfig.logPrefix}_welcome_email.sent`, {
							purchaseId: purchase.id,
							resourceId: context.resourceId,
							resourceType: context.resourceType,
							productType: context.productType,
							emailType: 'team_purchaser',
						})
					},
				)
			}

			// Handle commented out live office hours logic
			if (isFullPriceCouponRedemption) {
				// Future: Live office hours invitation logic
			}
		} else {
			// Step 11: Handle individual purchases
			if (['Valid', 'Restricted'].includes(purchase.status)) {
				// Ensure organization membership (shared across all resources)
				const { organizationId, orgMembership } = await step.run(
					`ensure org membership`,
					async () => {
						// Determine who invited this user - for full price coupon redemptions,
						// it should be the original bulk purchaser
						const invitedById =
							isFullPriceCouponRedemption &&
							bulkCouponData?.originalBulkPurchase?.userId
								? bulkCouponData.originalBulkPurchase.userId
								: user.id

						// Use the organization from purchase if available, otherwise ensure personal org
						if (purchase.organizationId) {
							const orgMembership = await adapter.addMemberToOrganization({
								organizationId: purchase.organizationId,
								userId: user.id,
								invitedById,
							})

							if (!orgMembership) {
								throw new Error(`orgMembership is required`)
							}

							await adapter.addRoleForMember({
								organizationId: purchase.organizationId,
								memberId: orgMembership.id,
								role: 'learner',
							})

							return {
								organizationId: purchase.organizationId,
								orgMembership,
							}
						} else {
							// No organizationId on purchase - ensure user has personal org
							const personalOrgResult =
								await ensurePersonalOrganizationWithLearnerRole(user, adapter)

							return {
								organizationId: personalOrgResult.organization.id,
								orgMembership: personalOrgResult.membership,
							}
						}
					},
				)

				// Process each resource context
				for (const context of resourceContexts) {
					const resourceData = resourceDataMap[context.resourceId]
					if (!resourceData) continue

					const resourceConfig = PRODUCT_TYPE_CONFIG[context.productType]
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

					const discordRoleEntitlementType = await step.run(
						`get ${resourceConfig.logPrefix} discord role entitlement type for ${context.resourceId}`,
						async () => {
							return await db.query.entitlementTypes.findFirst({
								where: eq(entitlementTypes.name, resourceConfig.discordRole),
							})
						},
					)

					if (!contentAccessEntitlementType) continue

					// Determine which product to use for Discord role ID
					// Prefer the resource's own product, fallback to purchased product
					const productForDiscord = context.productForResource || product
					const discordRoleId = getDiscordRoleId(
						context.productType,
						productForDiscord,
					)

					// Send Discord role event
					if (context.productType === 'cohort') {
						await step.sendEvent(
							`send-discord-role-event for ${context.resourceId}`,
							{
								name: USER_ADDED_TO_COHORT_EVENT,
								data: {
									cohortId: resourceData.id,
									userId: user.id,
									discordRoleId,
								},
							},
						)
					} else {
						await step.sendEvent(
							`send-discord-role-event for ${context.resourceId}`,
							{
								name: USER_ADDED_TO_WORKSHOP_EVENT,
								data: {
									workshopId: resourceData.id,
									userId: user.id,
									discordRoleId,
								},
							},
						)
					}

					// Create Discord role entitlement
					if (discordRoleEntitlementType && discordRoleId) {
						await step.run(
							`add ${resourceConfig.logPrefix} discord entitlement for ${context.resourceId}`,
							async () => {
								const entitlementId = `${resourceData.id}-discord-${guid()}`
								await resourceConfig.createEntitlement({
									id: entitlementId,
									userId: user.id,
									organizationId,
									organizationMembershipId: orgMembership.id,
									entitlementType: discordRoleEntitlementType.id,
									sourceType: EntitlementSourceType.PURCHASE,
									sourceId: purchase.id,
									metadata: {
										discordRoleId,
									},
								})

								return {
									entitlementId,
									resourceId: context.resourceId,
								}
							},
						)
					}

					// Create content access entitlements
					await step.run(
						`add user to ${resourceConfig.logPrefix} via entitlement for ${context.resourceId}`,
						async () => {
							const createdEntitlements = await createResourceEntitlements(
								context.productType,
								resourceData,
								{
									user,
									purchase,
									organizationId,
									orgMembership,
									contentAccessEntitlementType,
								},
							)

							await log.info(
								`${resourceConfig.logPrefix}_entitlements_created`,
								{
									userId: user.id,
									resourceId: context.resourceId,
									resourceType: context.resourceType,
									productType: context.productType,
									[`${resourceConfig.logPrefix}Id`]: resourceData.id,
									entitlementsCreated: createdEntitlements.length,
									organizationId,
									organizationMembershipId: orgMembership.id,
								},
							)

							return {
								entitlementsCreated: createdEntitlements.length,
								entitlements: createdEntitlements,
								organizationId,
								organizationMembershipId: orgMembership.id,
								userId: user.id,
								resourceId: context.resourceId,
							}
						},
					)

					// Send welcome email
					await step.run(
						`send welcome email to individual for ${context.resourceId}`,
						async () => {
							const parsedResource = ContentResourceSchema.parse(resourceData)
							const contentUrl = generateContentUrl(
								parsedResource,
								context.productType,
								context.dayOneUnlockDate,
							)

							if (context.productType === 'cohort') {
								const ComponentToSend = getCohortWelcomeEmailVariant({
									isTeamPurchase: false,
									isFullPriceCouponRedemption,
								})

								await sendAnEmail({
									Component: ComponentToSend,
									componentProps: {
										cohortTitle:
											parsedResource.fields?.title ||
											parsedResource.fields?.slug,
										url: contentUrl,
										dayOneUnlockDate: context.dayOneUnlockDate || 'TBD',
										quantity: purchase.totalAmount || 1,
										userFirstName: user.name?.split(' ')[0],
									},
									Subject: `Welcome to ${parsedResource.fields?.title || config.defaultTitle}!`,
									To: user.email,
									ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
									From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
									type: 'transactional',
								})
							} else {
								const ComponentToSend = getWorkshopWelcomeEmailVariant({
									isTeamPurchase: false,
									isFullPriceCouponRedemption,
								})

								await sendAnEmail({
									Component: ComponentToSend,
									componentProps: {
										workshopTitle:
											parsedResource.fields?.title ||
											parsedResource.fields?.slug,
										url: contentUrl,
										quantity: purchase.totalAmount || 1,
										userFirstName: user.name?.split(' ')[0],
									},
									Subject: `Welcome to ${parsedResource.fields?.title || config.defaultTitle}!`,
									To: user.email,
									ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
									From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
									type: 'transactional',
								})
							}

							await log.info(`${resourceConfig.logPrefix}_welcome_email.sent`, {
								purchaseId: purchase.id,
								resourceId: context.resourceId,
								resourceType: context.resourceType,
								productType: context.productType,
								emailType: isFullPriceCouponRedemption
									? 'coupon_redeemer'
									: 'individual',
							})
						},
					)
				}

				// Future: Live office hours email logic
			} else {
				// send a slack message or something because it seems broken
			}
		}

		return {
			purchase,
			product,
			user,
			resourceContexts,
			isTeamPurchase,
			isFullPriceCouponRedemption,
			bulkCouponData,
		}
	},
)
