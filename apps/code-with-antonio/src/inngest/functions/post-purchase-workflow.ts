import config from '@/config'
import { db } from '@/db'
import { entitlementTypes } from '@/db/schema'
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
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { isAfter, parse } from 'date-fns'
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'
import { eq } from 'drizzle-orm'

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
	getDiscordRoleId,
	getResourceData,
	PRODUCT_TYPE_CONFIG,
	ProductType,
} from '../config/product-types'
import {
	USER_ADDED_TO_COHORT_EVENT,
	USER_ADDED_TO_WORKSHOP_EVENT,
} from './discord/add-discord-role-workflow'

/**
 * Get resource type based on product type
 */
const getResourceType = (productType: ProductType) => {
	const config = PRODUCT_TYPE_CONFIG[productType]
	if (!config) {
		throw new Error(`Unsupported product type: ${productType}`)
	}
	return config.resourceType
}

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
			if: 'event.data.productType == "cohort" || event.data.productType == "self-paced" || event.data.productType == "source-code-access"',
		},
		{
			event: FULL_PRICE_COUPON_REDEEMED_EVENT,
			if: 'event.data.productType == "cohort" || event.data.productType == "self-paced" || event.data.productType == "source-code-access"',
		},
	],
	async ({ event, step, db: adapter }) => {
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

		// Step 5: Get bulk coupon data if needed
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

		// Step 6: Find and get the primary resource
		const resourceType = getResourceType(productType)
		const primaryResourceId = product.resources?.find(
			(resource) => resource.resource?.type === resourceType,
		)?.resource.id

		const primaryResource = await step.run(
			`get ${resourceType} resource`,
			async () => {
				return getResourceData(primaryResourceId, productType)
			},
		)

		if (!primaryResource) {
			throw new Error(`${resourceType} resource not found`)
		}

		// Step 7: Calculate day one unlock date for cohorts
		const dayOneUnlockDate =
			productType === 'cohort'
				? (() => {
						const dayOneStartsAt = primaryResource.resources?.find(
							(resource) => resource.position === 0,
						)?.resource?.fields?.startsAt
						return dayOneStartsAt
							? formatInTimeZone(
									new Date(dayOneStartsAt),
									'America/Los_Angeles',
									'MMMM do, yyyy',
								)
							: 'TBD'
					})()
				: null

		// Step 8: Handle team purchases
		if (isTeamPurchase) {
			const bulkCoupon = await step.run('get bulk coupon', async () => {
				if (purchase.bulkCouponId) {
					return adapter.getCoupon(purchase.bulkCouponId)
				}
				return null
			})

			await step.run(`send welcome email to team purchaser`, async () => {
				const parsedPrimaryResource =
					ContentResourceSchema.parse(primaryResource)
				const contentUrl = generateContentUrl(
					parsedPrimaryResource,
					productType,
					dayOneUnlockDate,
				)

				if (productType === 'cohort') {
					const ComponentToSend = getCohortWelcomeEmailVariant({
						isTeamPurchase: true,
						isFullPriceCouponRedemption,
					})

					await sendAnEmail({
						Component: ComponentToSend,
						componentProps: {
							cohortTitle:
								parsedPrimaryResource.fields?.title ||
								parsedPrimaryResource.fields?.slug,
							url: contentUrl,
							dayOneUnlockDate: dayOneUnlockDate || 'TBD',
							quantity: bulkCoupon?.maxUses || 1,
							userFirstName: user.name?.split(' ')[0],
						},
						Subject: `Welcome to ${parsedPrimaryResource.fields?.title || config.defaultTitle}!`,
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
								parsedPrimaryResource.fields?.title ||
								parsedPrimaryResource.fields?.slug,
							url: contentUrl,
							quantity: bulkCoupon?.maxUses || 1,
							userFirstName: user.name?.split(' ')[0],
						},
						Subject: `Welcome to ${parsedPrimaryResource.fields?.title || config.defaultTitle}!`,
						To: user.email,
						ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
						From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
						type: 'transactional',
					})
				}

				await log.info(`${entitlementConfig.logPrefix}_welcome_email.sent`, {
					purchaseId: purchase.id,
					emailType: 'team_purchaser',
				})
			})

			// Handle commented out live office hours logic
			if (isFullPriceCouponRedemption) {
				// Future: Live office hours invitation logic
			}
		} else {
			// Step 9: Handle individual purchases
			if (['Valid', 'Restricted'].includes(purchase.status)) {
				// Get entitlement types
				const contentAccessEntitlementType = await step.run(
					`get ${entitlementConfig.logPrefix} content access entitlement type`,
					async () => {
						return await db.query.entitlementTypes.findFirst({
							where: eq(entitlementTypes.name, entitlementConfig.contentAccess),
						})
					},
				)

				const discordRoleEntitlementType = await step.run(
					`get ${entitlementConfig.logPrefix} discord role entitlement type`,
					async () => {
						return await db.query.entitlementTypes.findFirst({
							where: eq(entitlementTypes.name, entitlementConfig.discordRole),
						})
					},
				)

				// Ensure organization membership
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

				if (contentAccessEntitlementType && primaryResource) {
					// Send Discord role event
					const discordRoleId = getDiscordRoleId(productType, product)

					if (productType === 'cohort') {
						await step.sendEvent('send-discord-role-event', {
							name: USER_ADDED_TO_COHORT_EVENT,
							data: {
								cohortId: primaryResource.id,
								userId: user.id,
								discordRoleId,
							},
						})
					} else {
						await step.sendEvent('send-discord-role-event', {
							name: USER_ADDED_TO_WORKSHOP_EVENT,
							data: {
								workshopId: primaryResource.id,
								userId: user.id,
								discordRoleId,
							},
						})
					}

					// Create Discord role entitlement
					await step.run(
						`add ${entitlementConfig.logPrefix} discord entitlement`,
						async () => {
							if (!discordRoleEntitlementType) {
								return `no ${entitlementConfig.logPrefix} discord role entitlement type found`
							}

							if (!discordRoleId) {
								return `no discord ${entitlementConfig.logPrefix} role id found`
							}

							if (!primaryResource.id) {
								return `no ${entitlementConfig.logPrefix} resource id found`
							}

							const entitlementId = `${primaryResource.id}-discord-${guid()}`
							await entitlementConfig.createEntitlement({
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
							}
						},
					)

					// Create content access entitlements
					await step.run(
						`add user to ${entitlementConfig.logPrefix} via entitlement`,
						async () => {
							const createdEntitlements = await createResourceEntitlements(
								productType,
								primaryResource,
								{
									user,
									purchase,
									organizationId,
									orgMembership,
									contentAccessEntitlementType,
								},
							)

							await log.info(
								`${entitlementConfig.logPrefix}_entitlements_created`,
								{
									userId: user.id,
									[`${entitlementConfig.logPrefix}Id`]: primaryResource.id,
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
							}
						},
					)

					// Send welcome email
					await step.run(`send welcome email to individual`, async () => {
						const parsedPrimaryResource =
							ContentResourceSchema.parse(primaryResource)
						const contentUrl = generateContentUrl(
							parsedPrimaryResource,
							productType,
							dayOneUnlockDate,
						)

						if (productType === 'cohort') {
							const ComponentToSend = getCohortWelcomeEmailVariant({
								isTeamPurchase: false,
								isFullPriceCouponRedemption,
							})

							await sendAnEmail({
								Component: ComponentToSend,
								componentProps: {
									cohortTitle:
										parsedPrimaryResource.fields?.title ||
										parsedPrimaryResource.fields?.slug,
									url: contentUrl,
									dayOneUnlockDate: dayOneUnlockDate || 'TBD',
									quantity: purchase.totalAmount || 1,
									userFirstName: user.name?.split(' ')[0],
								},
								Subject: `Welcome to ${parsedPrimaryResource.fields?.title || config.defaultTitle}!`,
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
										parsedPrimaryResource.fields?.title ||
										parsedPrimaryResource.fields?.slug,
									url: contentUrl,
									quantity: purchase.totalAmount || 1,
									userFirstName: user.name?.split(' ')[0],
								},
								Subject: `Welcome to ${parsedPrimaryResource.fields?.title || config.defaultTitle}!`,
								To: user.email,
								ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
								From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
								type: 'transactional',
							})
						}

						await log.info(
							`${entitlementConfig.logPrefix}_welcome_email.sent`,
							{
								purchaseId: purchase.id,
								emailType: isFullPriceCouponRedemption
									? 'coupon_redeemer'
									: 'individual',
							},
						)
					})

					// Future: Live office hours email logic
				}
			} else {
				// send a slack message or something because it seems broken
			}
		}

		return {
			purchase,
			product,
			user,
			primaryResource,
			isTeamPurchase,
			isFullPriceCouponRedemption,
			bulkCouponData,
		}
	},
)
