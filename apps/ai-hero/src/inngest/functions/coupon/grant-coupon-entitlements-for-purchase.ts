import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import {
	coupon,
	entitlements,
	entitlementTypes,
	merchantCoupon as merchantCouponTable,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { EntitlementSourceType } from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'

import {
	GRANT_COUPON_ENTITLEMENTS_FOR_PURCHASE_EVENT,
	type GrantCouponEntitlementsForPurchase,
} from '../../events/grant-coupon-entitlements-for-purchase'

/**
 * Grant coupon-based entitlements for new purchase
 * If someone buys a product that has an eligibility condition (e.g., crash course),
 * grant them the entitlement for any matching coupons
 * For Valid purchases: use product's unit price (full price of product)
 * For Restricted purchases: grant coupon matching productId AND amount (create if needed) - use purchase total amount (what they actually paid)
 */
export const grantCouponEntitlementsForPurchase = inngest.createFunction(
	{
		id: 'grant-coupon-entitlements-for-purchase',
		name: 'Grant Coupon Entitlements for Purchase',
		idempotency: 'event.data.purchaseId',
	},
	{
		event: GRANT_COUPON_ENTITLEMENTS_FOR_PURCHASE_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		const {
			purchaseId,
			userId,
			productId,
			purchaseStatus,
			totalAmount,
			bulkCouponId,
		} = event.data

		// Step 1: Check if purchase is eligible for coupon entitlements
		const eligibilityCheck = await step.run(
			'check purchase eligibility for coupon entitlements',
			async () => {
				const isEligible =
					['Valid', 'Restricted'].includes(purchaseStatus) &&
					Number(totalAmount) > 0 &&
					!bulkCouponId

				if (!isEligible || !userId) {
					return {
						eligible: false,
						reason: 'Purchase not eligible for coupon entitlements',
					}
				}

				return { eligible: true }
			},
		)

		if (!eligibilityCheck.eligible) {
			return {
				checked: true,
				reason:
					'reason' in eligibilityCheck
						? eligibilityCheck.reason
						: 'Purchase not eligible for coupon entitlements',
			}
		}

		// Step 2: Calculate amount in cents for coupon matching
		const amountResult = await step.run(
			'calculate coupon amount in cents',
			async () => {
				const isRestricted = purchaseStatus === 'Restricted'
				const isValid = purchaseStatus === 'Valid'

				if (isValid) {
					const productPrice = await adapter.getPriceForProduct(productId)
					if (productPrice?.unitAmount) {
						const amountInCents = Math.round(
							Number(productPrice.unitAmount) * 100,
						)
						await log.info('coupon.entitlements.product_price_retrieved', {
							productId,
							unitAmount: productPrice.unitAmount,
							unitAmountInDollars: productPrice.unitAmount,
							amountInCents,
							purchaseTotalAmount: totalAmount,
						})
						return { amountInCents, error: null }
					} else {
						await log.warn('coupon.entitlements.no_product_price_for_valid', {
							productId,
							userId,
							productPrice,
						})
						return {
							amountInCents: null,
							error: 'No product price found',
							productPrice,
						}
					}
				} else if (isRestricted) {
					const amountInCents = Math.round(Number(totalAmount) * 100)
					return { amountInCents, error: null }
				}

				return { amountInCents: null, error: 'Could not determine amount' }
			},
		)

		if (amountResult.error || !amountResult.amountInCents) {
			return {
				checked: true,
				error: amountResult.error || 'Could not determine amount in cents',
				productId,
				productPrice:
					'productPrice' in amountResult
						? amountResult.productPrice
						: undefined,
			}
		}

		const amountInCents = amountResult.amountInCents

		// Step 3: Find coupons for product with eligibility conditions
		const anyCouponsForProduct = await step.run(
			'find coupons for product',
			async () => {
				const coupons = await db.query.coupon.findMany({
					where: (coupons, { sql, and, eq, isNotNull }) =>
						and(
							eq(coupons.status, 1),
							sql`JSON_EXTRACT(${coupons.fields}, '$.eligibilityCondition.productId') = ${productId}`,
							isNotNull(
								sql`JSON_EXTRACT(${coupons.fields}, '$.eligibilityCondition.type')`,
							),
						),
				})

				if (coupons.length === 0) {
					await log.info('coupon.entitlements.no_eligibility_setup', {
						productId,
						purchaseStatus,
						userId,
					})
				}

				return coupons
			},
		)

		if (anyCouponsForProduct.length === 0) {
			return {
				checked: true,
				matchingCoupons: 0,
				reason: 'No eligibility setup for product',
			}
		}

		// Step 4: Get coupon credit entitlement type
		const couponCreditEntitlementType = await step.run(
			'get coupon credit entitlement type',
			async () => {
				const entitlementType = await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'apply_special_credit'),
				})

				if (!entitlementType) {
					await log.warn('coupon.entitlements.type_not_found', {
						productId,
						userId,
						purchaseStatus,
					})
				}

				return entitlementType
			},
		)

		if (!couponCreditEntitlementType) {
			return { checked: true, error: 'Entitlement type not found' }
		}

		// Step 5: Get user data
		const user = await step.run('get user', async () => {
			return adapter.getUserById(userId)
		})

		if (!user) {
			return { checked: true, error: 'User not found' }
		}

		// Step 6: Check if user already has entitlement for this product
		const existingEntitlementCheck = await step.run(
			'check existing entitlement for product',
			async () => {
				const existingEntitlement = await db.query.entitlements.findFirst({
					where: (entitlements, { and, eq, isNull, sql }) =>
						and(
							eq(entitlements.userId, userId),
							eq(entitlements.sourceType, EntitlementSourceType.COUPON),
							eq(entitlements.entitlementType, couponCreditEntitlementType.id),
							sql`JSON_EXTRACT(${entitlements.metadata}, '$.eligibilityProductId') = ${productId}`,
							isNull(entitlements.deletedAt),
						),
				})

				if (existingEntitlement) {
					await log.info('coupon.entitlements.already_exists_for_product', {
						userId,
						productId,
						existingEntitlementId: existingEntitlement.id,
						existingEntitlementSourceId: existingEntitlement.sourceId,
						reason:
							'User already has an entitlement for this eligibility product',
					})
				}

				return {
					exists: !!existingEntitlement,
					entitlement: existingEntitlement
						? {
								id: existingEntitlement.id,
								sourceId: existingEntitlement.sourceId,
							}
						: null,
				}
			},
		)

		if (existingEntitlementCheck.exists) {
			return {
				checked: true,
				skipped: true,
				reason: 'User already has an entitlement for this eligibility product',
				existingEntitlementId: existingEntitlementCheck.entitlement?.id,
			}
		}

		const isRestricted = purchaseStatus === 'Restricted'
		const isValid = purchaseStatus === 'Valid'

		// Handle Restricted purchase
		if (isRestricted && userId) {
			// Step 7: Find or create merchant coupon
			const merchantCouponResult = await step.run(
				'find or create merchant coupon for restricted',
				async () => {
					// First, try to find matching coupon
					const matchingCoupon = anyCouponsForProduct.find(
						(c) => c.amountDiscount === amountInCents,
					)

					if (matchingCoupon) {
						return {
							couponToGrant: matchingCoupon,
							merchantCouponId: null,
							created: false,
						}
					}

					// No matching coupon, need to create one
					const couponType = 'special credit'
					const existingMerchantCoupon =
						await db.query.merchantCoupon.findFirst({
							where: and(
								eq(merchantCouponTable.amountDiscount, amountInCents),
								eq(merchantCouponTable.type, couponType),
							),
						})

					let merchantCouponId: string | null = null

					if (existingMerchantCoupon) {
						merchantCouponId = existingMerchantCoupon.id
						await log.info(
							'coupon.entitlements.merchant_coupon_found_for_restricted',
							{
								merchantCouponId,
								amountInCents,
								productId,
							},
						)
					} else {
						const merchantAccountRecord =
							await courseBuilderAdapter.getMerchantAccount({
								provider: 'stripe',
							})
						if (!merchantAccountRecord) {
							await log.error(
								'coupon.entitlements.no_merchant_account_for_restricted',
								{
									amountInCents,
									productId,
								},
							)
							return {
								couponToGrant: null,
								merchantCouponId: null,
								created: false,
								error: 'No merchant account found',
							}
						}

						const couponName = `special credit $${(amountInCents / 100).toFixed(2)}`
						const stripeCouponId =
							await stripeProvider.options.paymentsAdapter.createCoupon({
								duration: 'forever',
								name: couponName,
								amount_off: amountInCents,
								currency: 'USD',
								metadata: {
									type: 'special credit',
								},
							})

						merchantCouponId = `ai_${uuidv4()}`
						await db.insert(merchantCouponTable).values({
							id: merchantCouponId,
							merchantAccountId: merchantAccountRecord.id,
							status: 1,
							identifier: stripeCouponId,
							amountDiscount: amountInCents,
							type: couponType,
						})

						await log.info(
							'coupon.entitlements.merchant_coupon_created_for_restricted',
							{
								merchantCouponId,
								stripeCouponId,
								amountInCents,
								productId,
							},
						)
					}

					// Create the coupon if we don't have one yet
					if (!matchingCoupon && merchantCouponId) {
						const newCouponId = `coupon_${guid()}`
						const fields: Record<string, any> = {
							stackable: true,
							eligibilityCondition: {
								type: 'hasValidProductPurchase',
								productId,
							},
						}

						await db.insert(coupon).values({
							id: newCouponId,
							merchantCouponId,
							maxUses: -1,
							amountDiscount: amountInCents,
							status: 1,
							fields,
						})

						const createdCoupon = await db.query.coupon.findFirst({
							where: eq(coupon.id, newCouponId),
						})

						await log.info(
							'coupon.entitlements.coupon_created_for_restricted',
							{
								couponId: newCouponId,
								amountInCents,
								productId,
								userId,
							},
						)

						return {
							couponToGrant: createdCoupon,
							merchantCouponId,
							created: true,
						}
					}

					return {
						couponToGrant: matchingCoupon || null,
						merchantCouponId,
						created: false,
					}
				},
			)

			if (
				('error' in merchantCouponResult && merchantCouponResult.error) ||
				!merchantCouponResult.couponToGrant
			) {
				return {
					checked: true,
					error:
						('error' in merchantCouponResult && merchantCouponResult.error) ||
						'Failed to create coupon',
				}
			}

			// Step 8: Grant entitlement for restricted purchase
			await step.run('grant entitlement for restricted purchase', async () => {
				const personalOrgResult =
					await ensurePersonalOrganizationWithLearnerRole(
						{ id: user.id, email: user.email },
						adapter,
					)

				const existingEntitlement = await db.query.entitlements.findFirst({
					where: (entitlements, { and, eq, isNull }) =>
						and(
							eq(entitlements.userId, userId),
							eq(entitlements.sourceId, merchantCouponResult.couponToGrant!.id),
							eq(entitlements.sourceType, EntitlementSourceType.COUPON),
							eq(entitlements.entitlementType, couponCreditEntitlementType.id),
							isNull(entitlements.deletedAt),
						),
				})

				if (!existingEntitlement) {
					const entitlementId = `${merchantCouponResult.couponToGrant!.id}-${guid()}`
					await db.insert(entitlements).values({
						id: entitlementId,
						userId,
						organizationId: personalOrgResult.organization.id,
						organizationMembershipId: personalOrgResult.membership.id,
						entitlementType: couponCreditEntitlementType.id,
						sourceType: EntitlementSourceType.COUPON,
						sourceId: merchantCouponResult.couponToGrant!.id,
						metadata: {
							eligibilityProductId: productId,
						},
					})

					await log.info(
						'coupon.entitlements.granted_for_restricted_purchase',
						{
							userId,
							productId,
							purchaseId,
							couponId: merchantCouponResult.couponToGrant!.id,
							amountInCents,
						},
					)

					return { granted: true, entitlementId }
				}

				return { granted: false, reason: 'Already exists' }
			})
		} else if (isValid && amountInCents > 0 && userId) {
			// Handle Valid purchase
			// Step 7: Find matching coupon
			const matchingCouponResult = await step.run(
				'find matching coupon for valid purchase',
				async () => {
					await log.info('coupon.entitlements.valid_purchase_matching', {
						userId,
						productId,
						productUnitPriceInCents: amountInCents,
						totalCouponsForProduct: anyCouponsForProduct.length,
						couponAmounts: anyCouponsForProduct.map((c) => ({
							couponId: c.id,
							amountDiscount: c.amountDiscount,
							percentageDiscount: c.percentageDiscount,
						})),
					})

					const matchingCoupon = anyCouponsForProduct.find((c) => {
						if (c.amountDiscount === null || c.amountDiscount === undefined) {
							return false
						}

						const couponAmount = Number(c.amountDiscount)
						return couponAmount === amountInCents
					})

					if (matchingCoupon) {
						await log.info('coupon.entitlements.matching_coupon_found', {
							couponId: matchingCoupon.id,
							couponAmountDiscount: matchingCoupon.amountDiscount,
							productUnitPriceInCents: amountInCents,
						})
					} else {
						await log.warn('coupon.entitlements.no_matching_coupon_found', {
							productUnitPriceInCents: amountInCents,
							availableCouponAmounts: anyCouponsForProduct
								.map((c) =>
									c.amountDiscount ? Number(c.amountDiscount) : null,
								)
								.filter((a): a is number => a !== null),
						})
						await log.info('coupon.entitlements.no_matching_amount_for_valid', {
							userId,
							productId,
							productUnitPriceInCents: amountInCents,
							purchaseAmount: totalAmount,
							reason:
								'No coupon exists for product unit price (Valid purchases do not auto-create)',
						})
					}

					return { matchingCoupon: matchingCoupon || null }
				},
			)

			if (matchingCouponResult.matchingCoupon) {
				// Step 8: Grant entitlement for valid purchase
				await step.run('grant entitlement for valid purchase', async () => {
					const personalOrgResult =
						await ensurePersonalOrganizationWithLearnerRole(
							{ id: user.id, email: user.email },
							adapter,
						)

					const existingEntitlement = await db.query.entitlements.findFirst({
						where: (entitlements, { and, eq, isNull }) =>
							and(
								eq(entitlements.userId, userId),
								eq(
									entitlements.sourceId,
									matchingCouponResult.matchingCoupon!.id,
								),
								eq(entitlements.sourceType, EntitlementSourceType.COUPON),
								eq(
									entitlements.entitlementType,
									couponCreditEntitlementType.id,
								),
								isNull(entitlements.deletedAt),
							),
					})

					if (!existingEntitlement) {
						const entitlementId = `${matchingCouponResult.matchingCoupon!.id}-${guid()}`
						await db.insert(entitlements).values({
							id: entitlementId,
							userId,
							organizationId: personalOrgResult.organization.id,
							organizationMembershipId: personalOrgResult.membership.id,
							entitlementType: couponCreditEntitlementType.id,
							sourceType: EntitlementSourceType.COUPON,
							sourceId: matchingCouponResult.matchingCoupon!.id,
							metadata: {
								eligibilityProductId: productId,
							},
						})

						await log.info('coupon.entitlements.granted_for_valid_purchase', {
							userId,
							productId,
							purchaseId,
							couponId: matchingCouponResult.matchingCoupon!.id,
							productUnitPriceInCents: amountInCents,
							purchaseAmount: totalAmount,
						})

						return { granted: true, entitlementId }
					} else {
						await log.info(
							'coupon.entitlements.already_exists_for_valid_purchase',
							{
								userId,
								productId,
								couponId: matchingCouponResult.matchingCoupon!.id,
								productUnitPriceInCents: amountInCents,
							},
						)
						return { granted: false, reason: 'Already exists' }
					}
				})
			}
		}

		return {
			checked: true,
			purchaseId,
			productId,
			userId,
			purchaseStatus,
		}
	},
)
