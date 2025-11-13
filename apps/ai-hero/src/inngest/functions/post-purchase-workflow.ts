import config from '@/config'
import { db } from '@/db'
import { coupon, entitlements, entitlementTypes } from '@/db/schema'
import LiveOfficeHoursInvitation, {
	generateICSAttachments,
} from '@/emails/live-office-hours-invitation'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getCohortWelcomeEmailVariant } from '@/inngest/utils/get-cohort-welcome-email-variant'
import { getWorkshopWelcomeEmailVariant } from '@/inngest/utils/get-workshop-welcome-email-variant'
import { getAllWorkshopsInCohort, getCohort } from '@/lib/cohorts-query'
import { EntitlementSourceType } from '@/lib/entitlements'
import {
	createResourceEntitlements,
	filterForUnpurchasedWorkshops,
	getAllUserEntitlements,
} from '@/lib/entitlements-query'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { getWorkshop } from '@/lib/workshops-query'
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

		// Step 5: Grant coupon-based entitlements for new purchase
		// If someone buys a product that has an eligibility condition (e.g., crash course),
		// grant them the entitlement for any matching coupons
		await step.run('grant coupon entitlements for new purchase', async () => {
			const isEligiblePurchase =
				purchase.status === 'Valid' &&
				Number(purchase.totalAmount) > 0 &&
				!purchase.bulkCouponId

			if (!isEligiblePurchase || !purchase.userId) {
				return {
					checked: true,
					reason: 'Purchase not eligible for coupon entitlements',
				}
			}
			const couponsWithEligibility = await db.query.coupon.findMany({
				where: (coupons, { sql, and, eq, isNotNull }) =>
					and(
						eq(coupons.status, 1),
						sql`JSON_EXTRACT(${coupons.fields}, '$.eligibilityCondition.productId') = ${purchase.productId}`,
						isNotNull(
							sql`JSON_EXTRACT(${coupons.fields}, '$.eligibilityCondition.type')`,
						),
					),
			})

			if (couponsWithEligibility.length === 0) {
				return { checked: true, matchingCoupons: 0 }
			}
			const couponCreditEntitlementType =
				await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'apply_special_credit'),
				})

			if (!couponCreditEntitlementType) {
				await log.warn('coupon.entitlements.type_not_found', {
					productId: purchase.productId,
					userId: purchase.userId,
				})
				return { checked: true, error: 'Entitlement type not found' }
			}
			const personalOrgResult = await ensurePersonalOrganizationWithLearnerRole(
				{ id: user.id, email: user.email },
				adapter,
			)

			let granted = 0
			const grantedCouponIds: string[] = []

			const userId = user.id
			for (const coupon of couponsWithEligibility) {
				const existingEntitlement = await db.query.entitlements.findFirst({
					where: (entitlements, { and, eq, isNull }) =>
						and(
							eq(entitlements.userId, userId),
							eq(entitlements.sourceId, coupon.id),
							eq(entitlements.sourceType, EntitlementSourceType.COUPON),
							eq(entitlements.entitlementType, couponCreditEntitlementType.id),
							isNull(entitlements.deletedAt),
						),
				})

				if (existingEntitlement) {
					continue
				}

				const entitlementId = `${coupon.id}-${guid()}`
				await db.insert(entitlements).values({
					id: entitlementId,
					userId,
					organizationId: personalOrgResult.organization.id,
					organizationMembershipId: personalOrgResult.membership.id,
					entitlementType: couponCreditEntitlementType.id,
					sourceType: EntitlementSourceType.COUPON,
					sourceId: coupon.id,
					metadata: {
						eligibilityProductId: purchase.productId,
					},
				})

				granted++
				grantedCouponIds.push(coupon.id)
			}

			if (granted > 0) {
				await log.info('coupon.entitlements.granted_for_new_purchase', {
					userId: purchase.userId,
					productId: purchase.productId,
					purchaseId: purchase.id,
					granted,
					couponIds: grantedCouponIds,
				})
			}

			return {
				checked: true,
				matchingCoupons: couponsWithEligibility.length,
				granted,
				couponIds: grantedCouponIds,
			}
		})

		// Step 6: Mark entitlement-based coupons as used (set deletedAt) if they were used in this checkout
		await step.run('mark entitlement coupons as used', async () => {
			const checkoutSessionId = event.data.checkoutSessionId
			if (!checkoutSessionId || !purchase.userId) {
				return { marked: 0, reason: 'No checkout session ID or user ID' }
			}

			if (!paymentProvider) {
				return { marked: 0, reason: 'No payment provider available' }
			}

			const checkoutSession =
				await paymentProvider.options.paymentsAdapter.getCheckoutSession(
					checkoutSessionId,
				)

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

		// Step 8: Find and get the primary resource
		const allProductResourceIdsWithTypes = await step.run(
			`get all product resource ids`,
			async () => {
				return (
					product.resources
						?.map((resource) => ({
							id: resource.resource.id,
							type: resource.resource.type,
						}))
						.filter((resource): resource is { id: string; type: string } =>
							Boolean(resource),
						) || []
				)
			},
		)

		const allProductResources = await step.run(
			`get all product resources`,
			async () => {
				return await Promise.all(
					allProductResourceIdsWithTypes.map(async (resource) => {
						if (resource.type === 'cohort') {
							return ContentResourceSchema.parse(await getCohort(resource.id))
						} else if (resource.type === 'workshop') {
							return ContentResourceSchema.parse(await getWorkshop(resource.id))
						}
					}),
				)
			},
		)

		if (!allProductResources || allProductResources.length === 0) {
			throw new Error(`resources for product ${product.id} not found`)
		}

		// Step 9: Calculate day one unlock date for cohorts
		const dayOneUnlockDates =
			productType === 'cohort'
				? (() => {
						// Collect all day one unlock dates from cohort resources
						const dates = allProductResources
							.map((resource) => {
								const dayOneStartsAt = resource?.resources?.find(
									(r) => r.position === 0,
								)?.resource?.fields?.startsAt

								return dayOneStartsAt
									? formatInTimeZone(
											new Date(dayOneStartsAt),
											'America/Los_Angeles',
											'MMMM do, yyyy',
										)
									: 'TBD'
							})
							.filter((date) => date !== 'TBD')

						// Return array if multiple, single value if one, or 'TBD' if none
						if (dates.length === 0) return 'TBD'
						if (dates.length === 1) return dates[0]
						return dates
					})()
				: null

		// Step 10: Handle team purchases
		if (isTeamPurchase) {
			const bulkCoupon = await step.run('get bulk coupon', async () => {
				if (purchase.bulkCouponId) {
					return adapter.getCoupon(purchase.bulkCouponId)
				}
				return null
			})

			await step.run(`send welcome email to team purchaser`, async () => {
				const parsedPrimaryResource = ContentResourceSchema.parse(
					allProductResources[0],
				)

				// technically we could have multiple cohorts in the same product but only handle the use-case where there is a single cohort with a start date.
				let contentUrl: string | string[] = ''
				if (dayOneUnlockDates && typeof dayOneUnlockDates === 'string') {
					contentUrl = generateContentUrl(
						parsedPrimaryResource,
						productType,
						dayOneUnlockDates,
					)
				}

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
							dayOneUnlockDate:
								dayOneUnlockDates && typeof dayOneUnlockDates === 'string'
									? dayOneUnlockDates
									: 'TBD',
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

				if (
					contentAccessEntitlementType &&
					allProductResources &&
					allProductResources.length > 0
				) {
					const userEntitlements = await step.run(
						`get all user entitlements for user ${user.id}`,
						async () => {
							return await getAllUserEntitlements(user.id)
						},
					)

					const allProductWorkshops = await step.run(
						`get all product workshops`,
						async () => {
							const workshopsArrays = await Promise.all(
								allProductResources.map(async (resource) => {
									if (resource.type === 'cohort') {
										const workshops = await getAllWorkshopsInCohort(resource.id)
										return workshops.map((workshop) =>
											ContentResourceSchema.parse(workshop),
										)
									} else if (resource.type === 'workshop') {
										return [ContentResourceSchema.parse(resource)]
									}
									return []
								}),
							)

							const flattened = workshopsArrays.flat()
							await log.info('workshops_retrieved', {
								totalWorkshops: flattened.length,
								workshopIds: flattened.map((w) => w.id),
								userId: user.id,
							})
							return flattened
						},
					)

					// All workshops in the product that the user does not have access to
					const unpurchasedProductWorkshops = await step.run(
						'filter unpurchased workshops',
						async () => {
							const filtered = await filterForUnpurchasedWorkshops(
								userEntitlements,
								allProductWorkshops,
							)
							await log.info('unpurchased_workshops_filtered', {
								totalUnpurchased: filtered.length,
								unpurchasedWorkshopIds: filtered.map((w) => w.id),
								userId: user.id,
							})
							return filtered
						},
					)

					// The workshops that are separate from the cohort resource in the product (e.g. crash course)
					const workshopResources = allProductResources.filter(
						(resource) => resource.type === 'workshop',
					)
					const unpurchasedProductWorkshopResources = await step.run(
						'filter unpurchased product workshop resources',
						async () => {
							const filtered = await filterForUnpurchasedWorkshops(
								userEntitlements,
								workshopResources,
							)
							await log.info('unpurchased_standalone_workshops_filtered', {
								totalUnpurchasedStandalone: filtered.length,
								unpurchasedStandaloneWorkshopIds: filtered.map((w) => w.id),
								userId: user.id,
							})
							return filtered
						},
					)

					// Send Discord role event
					const discordRoleId = getDiscordRoleId(productType, product)
					if (productType === 'cohort') {
						// assuming one cohort resource in product
						const cohortResource = allProductResources.find(
							(resource) => resource.type === 'cohort',
						)
						if (!cohortResource) {
							throw new Error(
								`no cohort resource found in product ${product.id}`,
							)
						}
						await step.sendEvent(
							`send discord role event in product ${product.id}`,
							{
								name: USER_ADDED_TO_COHORT_EVENT,
								data: {
									cohortId: cohortResource.id,
									userId: user.id,
									discordRoleId,
								},
							},
						)

						if (
							unpurchasedProductWorkshopResources &&
							unpurchasedProductWorkshopResources.length > 0
						) {
							await Promise.all(
								unpurchasedProductWorkshopResources.map(async (resource) => {
									await step.sendEvent(
										`send discord role event in product ${product.id}`,
										{
											name: USER_ADDED_TO_WORKSHOP_EVENT,
											data: {
												workshopId: resource.id,
												userId: user.id,
												discordRoleId,
											},
										},
									)
								}),
							)
						}
					} else if (productType === 'self-paced') {
						// assumed all resources are workshops in self-paced products
						unpurchasedProductWorkshops.map(async (resource) => {
							await step.sendEvent(
								`send discord role event in product ${product.id}`,
								{
									name: USER_ADDED_TO_WORKSHOP_EVENT,
									data: {
										workshopId: resource.id,
										userId: user.id,
										discordRoleId,
									},
								},
							)
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

							if (!allProductResources || allProductResources.length === 0) {
								return `no ${entitlementConfig.logPrefix} resource id found`
							}

							if (productType === 'cohort') {
								const cohortResource = allProductResources.find(
									(resource) => resource.type === 'cohort',
								)
								if (!cohortResource) {
									throw new Error(
										`no cohort resource found in product ${product.id}`,
									)
								}
								const cohortEntitlementId = `${cohortResource.id}-discord-${guid()}`
								await entitlementConfig.createEntitlement({
									id: cohortEntitlementId,
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

								let workshopEntitlementIds: string[] = []
								if (
									unpurchasedProductWorkshopResources &&
									unpurchasedProductWorkshopResources.length > 0
								) {
									workshopEntitlementIds = await Promise.all(
										unpurchasedProductWorkshopResources.map(
											async (resource) => {
												const workshopEntitlementId = `${resource.id}-discord-${guid()}`
												workshopEntitlementIds.push(workshopEntitlementId)
												return await entitlementConfig.createEntitlement({
													id: workshopEntitlementId,
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
											},
										),
									)
								}

								return [cohortEntitlementId, ...workshopEntitlementIds]
							} else if (productType === 'self-paced') {
								const entitlementIds = await Promise.all(
									unpurchasedProductWorkshops.map(async (resource) => {
										const entitlementId = `${resource.id}-discord-${guid()}`
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
										return entitlementId
									}),
								)

								return entitlementIds
							}

							return []
						},
					)

					// Create content access entitlements
					await Promise.all(
						unpurchasedProductWorkshops.map(async (resource) => {
							await step.run(
								`add user to ${entitlementConfig.logPrefix} via entitlement`,
								async () => {
									const createdEntitlements = await createResourceEntitlements(
										'self-paced',
										resource,
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
											[`${entitlementConfig.logPrefix}Id`]: resource.id,
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
						}),
					)

					// Send welcome email
					await step.run(`send welcome email to individual`, async () => {
						let parsedPrimaryResource: ContentResource | undefined
						if (productType === 'cohort') {
							parsedPrimaryResource = ContentResourceSchema.parse(
								allProductResources.find(
									(resource) => resource.type === 'cohort',
								),
							)
							if (!parsedPrimaryResource) {
								throw new Error(
									`no cohort resource found in product ${product.id}`,
								)
							}
						} else if (productType === 'self-paced') {
							parsedPrimaryResource = ContentResourceSchema.parse(
								allProductResources.find(
									(resource) => resource.type === 'workshop',
								),
							)
							if (!parsedPrimaryResource) {
								throw new Error(
									`no workshop resource found in product ${product.id}`,
								)
							}
						}

						if (!parsedPrimaryResource) {
							throw new Error(
								`no primary resource found in product ${product.id}`,
							)
						}

						let contentUrl: string | string[] = ''
						if (dayOneUnlockDates && typeof dayOneUnlockDates === 'string') {
							contentUrl = generateContentUrl(
								parsedPrimaryResource,
								productType,
								dayOneUnlockDates,
							)
						}
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
									dayOneUnlockDate:
										dayOneUnlockDates && typeof dayOneUnlockDates === 'string'
											? dayOneUnlockDates
											: 'TBD',
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
			allProductResources,
			isTeamPurchase,
			isFullPriceCouponRedemption,
			bulkCouponData,
		}
	},
)
