import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	coupon,
	entitlements,
	entitlementTypes,
	merchantCoupon as merchantCouponTable,
	purchases,
	users,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { EntitlementSourceType } from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { and, eq, gt, inArray, isNull } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

import { guid as mysqlGuid } from '@coursebuilder/adapter-drizzle/mysql'

export const CREATE_PPP_CREDIT_COUPONS_FOR_PURCHASERS_EVENT =
	'coupon/create-ppp-credit-for-purchasers' as const

export type CreatePPPCreditCouponsForPurchasersEvent = {
	name: typeof CREATE_PPP_CREDIT_COUPONS_FOR_PURCHASERS_EVENT
	data: {
		productId: string // The product that was purchased (to find Restricted purchases)
		restrictedToProductId: string // The product ID the coupon can be used for
	}
}

/**
 * Creates a fixed discount merchant coupon with Stripe coupon for individual purchases
 * @param amountDiscount - The fixed discount amount in cents (e.g., 2000 for $20)
 * @param isSpecialCredit - Whether this is a special credit coupon (true) or regular special coupon (false)
 * @returns The merchant coupon ID
 */
async function createOrFindFixedMerchantCoupon(
	amountDiscount: number,
	isSpecialCredit: boolean = false,
): Promise<string | null> {
	if (amountDiscount <= 0) {
		return null
	}

	const couponType = isSpecialCredit ? 'special credit' : 'special'

	const existingMerchantCoupon = await db.query.merchantCoupon.findFirst({
		where: and(
			eq(merchantCouponTable.amountDiscount, amountDiscount),
			eq(merchantCouponTable.type, couponType),
		),
	})

	if (existingMerchantCoupon) {
		await log.info('coupon.merchant_coupon_fixed.found', {
			merchantCouponId: existingMerchantCoupon.id,
			amountDiscount,
		})
		return existingMerchantCoupon.id
	}

	const merchantAccountRecord = await courseBuilderAdapter.getMerchantAccount({
		provider: 'stripe',
	})
	if (!merchantAccountRecord) {
		await log.error('coupon.merchant_coupon_fixed.no_account', {
			amountDiscount,
		})
		throw new Error('No merchant account found')
	}

	try {
		// Create the Stripe coupon for individual purchases
		const couponName = isSpecialCredit
			? `special credit $${(amountDiscount / 100).toFixed(2)}`
			: `special $${(amountDiscount / 100).toFixed(2)}`
		const stripeCouponId =
			await stripeProvider.options.paymentsAdapter.createCoupon({
				duration: 'forever',
				name: couponName,
				amount_off: amountDiscount,
				currency: 'USD',
				metadata: {
					type: 'special',
				},
			})

		// Create the merchant coupon in the database
		const merchantCouponId = `ai_${uuidv4()}`
		await db.insert(merchantCouponTable).values({
			id: merchantCouponId,
			merchantAccountId: merchantAccountRecord.id,
			status: 1,
			identifier: stripeCouponId,
			amountDiscount,
			type: couponType,
		})

		await log.info('coupon.merchant_coupon_fixed.created', {
			merchantCouponId,
			stripeCouponId,
			amountDiscount,
		})

		return merchantCouponId
	} catch (error) {
		await log.error('coupon.merchant_coupon_fixed.creation_failed', {
			amountDiscount,
			error: error instanceof Error ? error.message : 'Unknown error',
		})
		throw error
	}
}

/**
 * Inngest function to create PPP credit coupons for people who have purchased a specific product with Restricted status.
 * Creates one coupon per purchaser based on the amount they paid, and grants entitlements.
 */
export const createPPPCreditCouponsForPurchasers = inngest.createFunction(
	{
		id: `create-ppp-credit-coupons-for-purchasers`,
		name: `Create PPP Credit Coupons for Purchasers`,
		idempotency: 'event.data.productId',
	},
	{
		event: CREATE_PPP_CREDIT_COUPONS_FOR_PURCHASERS_EVENT,
	},
	async ({ event, step }) => {
		const { productId, restrictedToProductId } = event.data
		const maxUses = -1

		// Find eligible purchases with Restricted status
		const eligiblePurchases = await step.run(
			'find restricted purchases',
			async () => {
				const purchasesList = await db.query.purchases.findMany({
					where: and(
						eq(purchases.productId, productId),
						eq(purchases.status, 'Restricted'),
						gt(purchases.totalAmount, '0'),
						isNull(purchases.bulkCouponId),
					),
					with: {
						user: true,
					},
				})

				const purchasesWithUsers = purchasesList.filter(
					(p): p is typeof p & { userId: string } =>
						Boolean(p.userId && p.user),
				)

				await log.info(
					'coupon.create_ppp_credit_for_purchasers.purchases_found',
					{
						productId,
						totalPurchases: purchasesList.length,
						purchasesWithUsers: purchasesWithUsers.length,
					},
				)

				return {
					purchases: purchasesWithUsers,
					summary: {
						totalPurchases: purchasesList.length,
						purchasesWithUsers: purchasesWithUsers.length,
					},
				}
			},
		)

		if (eligiblePurchases.purchases.length === 0) {
			await log.info(
				'coupon.create_ppp_credit_for_purchasers.no_eligible_purchases',
				{
					productId,
				},
			)
			return {
				created: 0,
				skipped: true,
				reason: 'No eligible Restricted purchases found for product',
				productId,
			}
		}

		// Get coupon credit entitlement type
		const couponCreditEntitlementType = await step.run(
			'get coupon credit entitlement type',
			async () => {
				const entitlementType = await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'apply_special_credit'),
				})

				if (!entitlementType) {
					throw new Error(
						`Coupon credit entitlement type 'apply_special_credit' not found in database`,
					)
				}

				return {
					entitlementType,
					summary: {
						id: entitlementType.id,
						name: entitlementType.name,
						description: entitlementType.description,
					},
				}
			},
		)

		// Group purchases by amount (in cents) to reuse merchant coupons
		type PurchaseWithUser = (typeof eligiblePurchases.purchases)[number]
		const purchasesByAmount = await step.run(
			'group purchases by amount',
			async () => {
				const grouped = new Map<number, PurchaseWithUser[]>()

				for (const purchase of eligiblePurchases.purchases) {
					const amountInCents = Math.round(Number(purchase.totalAmount) * 100)

					if (amountInCents > 0) {
						if (!grouped.has(amountInCents)) {
							grouped.set(amountInCents, [])
						}
						grouped.get(amountInCents)!.push(purchase)
					}
				}

				await log.info(
					'coupon.create_ppp_credit_for_purchasers.grouped_by_amount',
					{
						productId,
						uniqueAmounts: grouped.size,
						totalPurchases: eligiblePurchases.purchases.length,
					},
				)

				return {
					grouped: Array.from(grouped.entries()),
					summary: {
						uniqueAmounts: grouped.size,
						totalPurchases: eligiblePurchases.purchases.length,
					},
				}
			},
		)

		// Create merchant coupons for each unique amount
		const merchantCouponsByAmount = await step.run(
			'create merchant coupons for each amount',
			async () => {
				const merchantCoupons = new Map<number, string>()

				for (const [
					amountInCents,
					purchasesForAmount,
				] of purchasesByAmount.grouped) {
					try {
						const merchantCouponId = await createOrFindFixedMerchantCoupon(
							amountInCents,
							true,
						)

						if (merchantCouponId) {
							merchantCoupons.set(amountInCents, merchantCouponId)
							await log.info(
								'coupon.create_ppp_credit_for_purchasers.merchant_coupon_ready',
								{
									productId,
									amountInCents,
									merchantCouponId,
									purchasesCount: purchasesForAmount.length,
								},
							)
						}
					} catch (error) {
						await log.error(
							'coupon.create_ppp_credit_for_purchasers.merchant_coupon_failed',
							{
								productId,
								amountInCents,
								error: error instanceof Error ? error.message : 'Unknown error',
							},
						)
					}
				}

				return {
					merchantCoupons: Array.from(merchantCoupons.entries()),
					summary: {
						created: merchantCoupons.size,
						totalAmounts: purchasesByAmount.summary.uniqueAmounts,
					},
				}
			},
		)

		// Create one coupon per unique amount (reused by all purchasers with that amount)
		const couponsByAmount = await step.run(
			'create coupons for each unique amount',
			async () => {
				const coupons = new Map<number, string>()
				const merchantCouponsMap = new Map(
					merchantCouponsByAmount.merchantCoupons,
				)

				const fields: Record<string, any> = {
					stackable: true,
					eligibilityCondition: {
						type: 'hasValidProductPurchase',
						productId: productId,
					},
				}

				for (const [
					amountInCents,
					purchasesForAmount,
				] of purchasesByAmount.grouped) {
					try {
						const merchantCouponId = merchantCouponsMap.get(amountInCents)

						if (!merchantCouponId) {
							await log.error(
								'coupon.create_ppp_credit_for_purchasers.no_merchant_coupon',
								{
									productId,
									amountInCents,
									purchasesCount: purchasesForAmount.length,
								},
							)
							continue
						}

						// Check if coupon already exists for this amount and restricted product
						const existingCoupon = await db.query.coupon.findFirst({
							where: and(
								eq(coupon.merchantCouponId, merchantCouponId),
								eq(coupon.restrictedToProductId, restrictedToProductId),
								eq(coupon.amountDiscount, amountInCents),
							),
						})

						if (existingCoupon) {
							// Reuse existing coupon
							coupons.set(amountInCents, existingCoupon.id)
							await log.info(
								'coupon.create_ppp_credit_for_purchasers.coupon_reused',
								{
									productId,
									amountInCents,
									couponId: existingCoupon.id,
									purchasesCount: purchasesForAmount.length,
								},
							)
						} else {
							// Create new coupon for this amount
							const couponId = `coupon_${guid()}`

							await db.insert(coupon).values({
								id: couponId,
								merchantCouponId,
								maxUses,
								restrictedToProductId: restrictedToProductId,
								amountDiscount: amountInCents,
								status: 1,
								fields,
							})

							coupons.set(amountInCents, couponId)
							await log.info(
								'coupon.create_ppp_credit_for_purchasers.coupon_created',
								{
									productId,
									amountInCents,
									couponId,
									purchasesCount: purchasesForAmount.length,
								},
							)
						}
					} catch (error) {
						await log.error(
							'coupon.create_ppp_credit_for_purchasers.coupon_creation_failed',
							{
								productId,
								amountInCents,
								error: error instanceof Error ? error.message : 'Unknown error',
								stack: error instanceof Error ? error.stack : undefined,
							},
						)
					}
				}

				return {
					coupons: Array.from(coupons.entries()),
					summary: {
						uniqueAmounts: coupons.size,
						totalAmounts: purchasesByAmount.grouped.length,
					},
				}
			},
		)

		// Create coupon data mapping for entitlements
		const couponData = await step.run(
			'prepare coupon data for entitlements',
			async () => {
				const couponsMap = new Map(couponsByAmount.coupons)
				const data: Array<{
					couponId: string
					userId: string
					amountInCents: number
				}> = []

				for (const purchase of eligiblePurchases.purchases) {
					if (!purchase.userId || !purchase.user) {
						continue
					}

					const amountInCents = Math.round(Number(purchase.totalAmount) * 100)
					const couponId = couponsMap.get(amountInCents)

					if (couponId) {
						data.push({
							couponId,
							userId: purchase.userId,
							amountInCents,
						})
					}
				}

				return {
					couponData: data,
					summary: {
						totalPurchases: eligiblePurchases.purchases.length,
						mappedPurchases: data.length,
					},
				}
			},
		)

		// Grant entitlements for each created coupon
		const entitlementsResult = await step.run(
			'grant entitlements to purchasers',
			async () => {
				let entitlementsGranted = 0
				let entitlementsSkipped = 0
				let entitlementsFailed = 0
				const grantedUserIds: string[] = []
				const skippedUserIds: string[] = []

				for (const {
					couponId,
					userId,
					amountInCents,
				} of couponData.couponData) {
					try {
						// Get user data
						const user = await db.query.users.findFirst({
							where: eq(users.id, userId),
						})

						if (!user || !user.email) {
							await log.warn(
								'coupon.create_ppp_credit_for_purchasers.user_not_found',
								{
									couponId,
									userId,
								},
							)
							entitlementsFailed++
							continue
						}

						// Ensure personal organization
						const personalOrgResult =
							await ensurePersonalOrganizationWithLearnerRole(
								{ id: user.id, email: user.email },
								courseBuilderAdapter,
							)

						// Check for existing entitlement
						const existingEntitlement = await db.query.entitlements.findFirst({
							where: and(
								eq(entitlements.userId, userId),
								eq(entitlements.sourceId, couponId),
								eq(entitlements.sourceType, EntitlementSourceType.COUPON),
								eq(
									entitlements.entitlementType,
									couponCreditEntitlementType.entitlementType.id,
								),
								isNull(entitlements.deletedAt),
							),
						})

						if (existingEntitlement) {
							entitlementsSkipped++
							skippedUserIds.push(userId)
							continue
						}

						// Create entitlement
						const entitlementId = `${couponId}-${mysqlGuid()}`
						await db.insert(entitlements).values({
							id: entitlementId,
							userId,
							organizationId: personalOrgResult.organization.id,
							organizationMembershipId: personalOrgResult.membership.id,
							entitlementType: couponCreditEntitlementType.entitlementType.id,
							sourceType: EntitlementSourceType.COUPON,
							sourceId: couponId,
							metadata: {
								eligibilityProductId: productId,
							},
						})

						entitlementsGranted++
						grantedUserIds.push(userId)
					} catch (error) {
						entitlementsFailed++
						await log.error(
							'coupon.create_ppp_credit_for_purchasers.entitlement_grant_failed',
							{
								couponId,
								userId,
								error: error instanceof Error ? error.message : 'Unknown error',
								stack: error instanceof Error ? error.stack : undefined,
							},
						)
					}
				}

				return {
					entitlementsGranted,
					entitlementsSkipped,
					entitlementsFailed,
					grantedUserIds,
					skippedUserIds,
					summary: {
						totalCoupons: couponData.couponData.length,
						entitlementsGranted,
						entitlementsSkipped,
						entitlementsFailed,
					},
				}
			},
		)

		await log.info('coupon.create_ppp_credit_for_purchasers.completed', {
			productId,
			totalPurchases: eligiblePurchases.summary.totalPurchases,
			uniqueCouponsCreated: couponsByAmount.summary.uniqueAmounts,
			entitlementsGranted: entitlementsResult.entitlementsGranted,
			entitlementsSkipped: entitlementsResult.entitlementsSkipped,
			entitlementsFailed: entitlementsResult.entitlementsFailed,
			uniqueAmounts: purchasesByAmount.summary.uniqueAmounts,
		})

		return {
			entitlementsGranted: entitlementsResult.entitlementsGranted,
			entitlementsSkipped: entitlementsResult.entitlementsSkipped,
			entitlementsFailed: entitlementsResult.entitlementsFailed,
			totalPurchases: eligiblePurchases.summary.totalPurchases,
			uniqueCouponsCreated: couponsByAmount.summary.uniqueAmounts,
			grantedUserIds: entitlementsResult.grantedUserIds,
			skippedUserIds: entitlementsResult.skippedUserIds,
			summary: {
				productId,
				totalEligiblePurchases: eligiblePurchases.summary.totalPurchases,
				uniqueAmounts: purchasesByAmount.summary.uniqueAmounts,
				merchantCouponsCreated: merchantCouponsByAmount.summary.created,
				uniqueCouponsCreated: couponsByAmount.summary.uniqueAmounts,
				entitlementsGranted: entitlementsResult.entitlementsGranted,
				entitlementsSkipped: entitlementsResult.entitlementsSkipped,
				entitlementsFailed: entitlementsResult.entitlementsFailed,
			},
		}
		// return { message: 'Create PPP Credit Coupons for Purchasers completed' }
	},
)
