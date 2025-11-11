import { z } from 'zod'

import { CourseBuilderAdapter, MockCourseBuilderAdapter } from '../../adapters'
import { Coupon, MerchantCoupon, Purchase } from '../../schemas'
import { MinimalMerchantCoupon } from '../../types'
import { getBulkDiscountPercent } from './bulk-coupon.js'
import { getPPPDiscountPercent } from './parity-coupon.js'

const PrismaCtxSchema: z.ZodType<CourseBuilderAdapter> = z.any()
const PurchaseSchema: z.ZodType<Purchase> = z.any()

const DetermineCouponToApplyParamsSchema = z.object({
	prismaCtx: PrismaCtxSchema,
	merchantCouponId: z.string().optional(),
	country: z.string(),
	quantity: z.number(),
	userId: z.string().optional(),
	productId: z.string(),
	purchaseToBeUpgraded: PurchaseSchema.nullable(),
	autoApplyPPP: z.boolean(),
	preferStacking: z.boolean().default(false),
	usedCoupon: z
		.object({
			merchantCouponId: z.string().nullable().optional(),
			restrictedToProductId: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
	usedCouponId: z.string().optional(),
	unitPrice: z.number(),
})

type DetermineCouponToApplyParams = z.infer<
	typeof DetermineCouponToApplyParamsSchema
>

const SPECIAL_TYPE = 'special' as const
const PPP_TYPE = 'ppp' as const
const BULK_TYPE = 'bulk' as const
const NONE_TYPE = 'none' as const

export const determineCouponToApply = async (
	params: DetermineCouponToApplyParams,
) => {
	const {
		prismaCtx,
		merchantCouponId,
		country,
		quantity,
		userId,
		productId,
		purchaseToBeUpgraded,
		autoApplyPPP,
		preferStacking,
		usedCoupon,
		usedCouponId,
		unitPrice,
	} = DetermineCouponToApplyParamsSchema.parse(params)
	// TODO: What are the lookups and logic checks we can
	// skip when there is no appliedMerchantCouponId?

	const {
		getMerchantCoupon,
		getPurchasesForUser,
		getEntitlementsForUser,
		getCoupon,
		getEntitlementTypeByName,
	} = prismaCtx

	// if usedCoupon is restricted to a different product, we shouldn't apply it
	const couponRestrictedToDifferentProduct =
		usedCoupon?.merchantCouponId === merchantCouponId &&
		usedCoupon?.restrictedToProductId &&
		usedCoupon?.restrictedToProductId !== productId

	const candidateMerchantCoupon =
		!couponRestrictedToDifferentProduct && merchantCouponId
			? await getMerchantCoupon(merchantCouponId)
			: null

	const specialMerchantCouponToApply =
		candidateMerchantCoupon?.type === SPECIAL_TYPE
			? candidateMerchantCoupon
			: null

	// Also check if the candidate coupon is a default coupon (percentage or fixed) that should be stackable
	// This allows default discounts (like 40% early bird or fixed amount) to stack with special credits
	const defaultCouponToApply =
		candidateMerchantCoupon &&
		candidateMerchantCoupon.type !== SPECIAL_TYPE &&
		((candidateMerchantCoupon.percentageDiscount ?? 0) > 0 ||
			(candidateMerchantCoupon.amountDiscount ?? 0) > 0)
			? candidateMerchantCoupon
			: null

	const userPurchases = await getPurchasesForUser(userId)

	const pppDetails = await getPPPDetails({
		specialMerchantCoupon: specialMerchantCouponToApply,
		appliedMerchantCoupon: candidateMerchantCoupon,
		country,
		quantity,
		purchaseToBeUpgraded,
		userPurchases,
		autoApplyPPP,
		prismaCtx,
		unitPrice,
	})

	const { bulkCouponToBeApplied, consideredBulk } = await getBulkCouponDetails({
		prismaCtx,
		userId,
		productId,
		quantity,
		appliedMerchantCoupon: specialMerchantCouponToApply,
		pppApplied: pppDetails.pppApplied,
		unitPrice,
	})

	let couponToApply: MinimalMerchantCoupon | null = null
	if (pppDetails.status === VALID_PPP) {
		couponToApply = pppDetails.pppCouponToBeApplied
	} else if (bulkCouponToBeApplied) {
		couponToApply = bulkCouponToBeApplied
	} else {
		couponToApply = specialMerchantCouponToApply
	}

	// It is only every PPP that ends up in the Available Coupons
	// list because with Special and Bulk we auto-apply those if
	// they are the best discount.
	const availableCoupons = pppDetails.availableCoupons

	// Narrow appliedCouponType to a union of consts
	const appliedCouponType = z
		.string()
		.nullish()
		.transform((couponType) => {
			if (couponType === PPP_TYPE) {
				return PPP_TYPE
			} else if (couponType === SPECIAL_TYPE) {
				return SPECIAL_TYPE
			} else if (couponType === BULK_TYPE) {
				return BULK_TYPE
			} else {
				return NONE_TYPE
			}
		})
		.parse(couponToApply?.type)

	// Determine the specific discount type being applied
	let appliedDiscountType: 'ppp' | 'bulk' | 'fixed' | 'percentage' | 'none' =
		'none'

	if (couponToApply) {
		if (appliedCouponType === PPP_TYPE) {
			appliedDiscountType = 'ppp'
		} else if (appliedCouponType === BULK_TYPE) {
			appliedDiscountType = 'bulk'
		} else if (
			couponToApply.amountDiscount !== null &&
			couponToApply.amountDiscount !== undefined &&
			couponToApply.amountDiscount > 0
		) {
			appliedDiscountType = 'fixed'
		} else if (
			couponToApply.percentageDiscount !== null &&
			couponToApply.percentageDiscount !== undefined &&
			couponToApply.percentageDiscount > 0
		) {
			appliedDiscountType = 'percentage'
		}
	}

	// Query entitlements for stackable coupon discounts
	const stackableDiscounts: Array<{
		coupon: MinimalMerchantCoupon
		source: 'default' | 'user' | 'entitlement'
		discountType: 'fixed' | 'percentage'
		amount: number // in cents or percentage (0-1)
		couponId: string
	}> = []

	/**
	 * Helper function to add a merchant coupon to stackable discounts if it has a valid discount
	 */
	const addStackableDiscount = (
		merchantCoupon: MinimalMerchantCoupon,
		source: 'default' | 'user' | 'entitlement',
		couponId: string,
	) => {
		const amountDiscount = merchantCoupon.amountDiscount ?? 0
		const percentageDiscount = merchantCoupon.percentageDiscount ?? 0

		if (amountDiscount > 0) {
			stackableDiscounts.push({
				coupon: merchantCoupon,
				source,
				discountType: 'fixed',
				amount: amountDiscount,
				couponId,
			})
		} else if (percentageDiscount > 0) {
			stackableDiscounts.push({
				coupon: merchantCoupon,
				source,
				discountType: 'percentage',
				amount: percentageDiscount,
				couponId,
			})
		}
	}

	// Check for entitlement-based coupons first to determine if stacking should be enabled
	// Stacking should ONLY be enabled if the user has entitlement-based coupons
	// This ensures we don't accidentally allow stacking for regular users
	// However, if preferStacking is explicitly false AND PPP is available, respect that choice (user prefers PPP)
	let shouldEnableStacking = preferStacking
	let couponEntitlements: Awaited<ReturnType<typeof getEntitlementsForUser>> =
		[]

	if (userId) {
		// Always check entitlements if userId exists

		const specialCreditEntitlementType = await getEntitlementTypeByName(
			'apply_special_credit',
		)
		const entitlementTypeId = specialCreditEntitlementType?.id

		if (entitlementTypeId) {
			couponEntitlements = await getEntitlementsForUser({
				userId,
				sourceType: 'COUPON',
				entitlementType: entitlementTypeId,
			})
		}

		// If entitlements exist, enable stacking UNLESS:
		// - preferStacking is explicitly false AND PPP is available (user prefers PPP over stacking)
		if (couponEntitlements.length > 0) {
			const shouldRespectPreferStackingFalse =
				preferStacking === false && pppDetails.status === VALID_PPP
			if (!shouldRespectPreferStackingFalse) {
				shouldEnableStacking = true
			}
		}
	}

	if (userId && shouldEnableStacking) {
		// Use the already-queried entitlements for coupon-based special credits

		// Get coupons for each entitlement and check if they're stackable
		for (const entitlement of couponEntitlements) {
			const coupon = await getCoupon(entitlement.sourceId)
			if (!coupon || !coupon.merchantCouponId) {
				continue
			}

			// Check if coupon is stackable
			const isStackable = coupon.fields?.stackable === true
			if (!isStackable) {
				continue
			}

			// Check if coupon is restricted to a different product
			if (
				coupon.restrictedToProductId &&
				coupon.restrictedToProductId !== productId
			) {
				continue
			}

			// Get merchant coupon
			const merchantCoupon = await getMerchantCoupon(coupon.merchantCouponId)
			if (!merchantCoupon) {
				continue
			}

			// Add to stackable discounts if it has a valid discount
			addStackableDiscount(
				{
					id: merchantCoupon.id,
					type: merchantCoupon.type,
					status: merchantCoupon.status,
					percentageDiscount: merchantCoupon.percentageDiscount,
					amountDiscount: merchantCoupon.amountDiscount,
				},
				'entitlement',
				coupon.id,
			)
		}

		// Add the user-entered or default special coupon if it's stackable
		if (specialMerchantCouponToApply) {
			let usedCouponRecord: Coupon | null = null

			if (usedCouponId) {
				usedCouponRecord = await getCoupon(usedCouponId)
			}

			// Determine if coupon is stackable based on type:
			// - Default coupons (default === true): stackable when entitlements exist (shouldEnableStacking)
			// - Entitlement-based coupons (default === false): require explicit stackable: true flag
			// - If coupon record can't be found: fail-closed (not stackable)
			const isStackable =
				usedCouponRecord?.default === true
					? shouldEnableStacking
					: usedCouponRecord?.default === false
						? usedCouponRecord?.fields?.stackable === true
						: false

			if (isStackable) {
				addStackableDiscount(
					specialMerchantCouponToApply,
					usedCoupon ? 'user' : 'default',
					usedCouponRecord?.id || usedCouponId || '',
				)
			}
		}

		// Add default coupon (percentage or fixed, like 40% early bird or fixed amount) if it's stackable
		// This allows default discounts to stack with special credits
		if (defaultCouponToApply && shouldEnableStacking) {
			// Get the coupon record to check if it's stackable
			// Only fetch if we have a coupon ID to look up
			const couponRecord = usedCouponId ? await getCoupon(usedCouponId) : null

			const isStackable = couponRecord?.fields?.stackable === true

			if (isStackable) {
				addStackableDiscount(
					defaultCouponToApply,
					usedCoupon ? 'user' : 'default',
					couponRecord?.id || usedCouponId || '',
				)
			}
		}
	}

	// Determine stacking path
	// Rules:
	// - If PPP is available and shouldEnableStacking = false → use PPP only (exclusive)
	// - If PPP is available and shouldEnableStacking = true → stack all discounts (ignore PPP)
	// - If no PPP and shouldEnableStacking = true → stack all applicable discounts
	// - If no PPP and shouldEnableStacking = false → no stacking
	let stackingPath: 'stack' | 'ppp' | 'none' = 'none'

	if (pppDetails.status === VALID_PPP) {
		if (shouldEnableStacking) {
			// Stacking is enabled (via entitlements), so ignore PPP and stack all discounts
			stackingPath = stackableDiscounts.length > 0 ? 'stack' : 'none'
		} else {
			// Stacking not enabled, so use PPP only and exclude all other discounts
			stackingPath = 'ppp'
			stackableDiscounts.length = 0
		}
	} else if (stackableDiscounts.length > 0 && shouldEnableStacking) {
		// No PPP available, but we have stackable discounts and stacking is enabled
		stackingPath = 'stack'
	}

	return {
		appliedMerchantCoupon: couponToApply || undefined,
		appliedCouponType,
		appliedDiscountType,
		availableCoupons,
		bulk: consideredBulk,
		stackableDiscounts,
		stackingPath,
	}
}

type UserPurchases = Awaited<
	ReturnType<CourseBuilderAdapter['getPurchasesForUser']>
>
const UserPurchasesSchema: z.ZodType<UserPurchases> = z.any()
const MerchantCouponSchema: z.ZodType<MerchantCoupon> = z.any()
const GetPPPDetailsParamsSchema = z.object({
	specialMerchantCoupon: MerchantCouponSchema.nullable(),
	appliedMerchantCoupon: MerchantCouponSchema.nullable(),
	quantity: z.number(),
	country: z.string(),
	purchaseToBeUpgraded: PurchaseSchema.nullable(),
	userPurchases: UserPurchasesSchema,
	autoApplyPPP: z.boolean(),
	prismaCtx: PrismaCtxSchema,
	unitPrice: z.number(),
})
type GetPPPDetailsParams = z.infer<typeof GetPPPDetailsParamsSchema>

const NO_PPP = 'NO_PPP' as const
const INVALID_PPP = 'INVALID_PPP' as const
const VALID_PPP = 'VALID_PPP' as const

const getPPPDetails = async ({
	specialMerchantCoupon,
	appliedMerchantCoupon,
	country,
	quantity,
	purchaseToBeUpgraded,
	userPurchases,
	autoApplyPPP,
	prismaCtx,
	unitPrice,
}: GetPPPDetailsParams) => {
	const hasMadeNonPPPDiscountedPurchase = userPurchases.some(
		(purchase) => purchase.status === 'Valid',
	)
	const hasOnlyPPPDiscountedPurchases = !hasMadeNonPPPDiscountedPurchase

	const expectedPPPDiscountPercent = getPPPDiscountPercent(country)

	// Compare PPP vs special merchant coupon by calculating actual discount amounts
	// to determine which provides better savings for the customer
	const subtotal = unitPrice * quantity
	const merchantDiscountAmount =
		specialMerchantCoupon?.amountDiscount !== null &&
		specialMerchantCoupon?.amountDiscount !== undefined &&
		specialMerchantCoupon?.amountDiscount > 0
			? (specialMerchantCoupon.amountDiscount / 100) * quantity // Convert cents to dollars and apply per seat
			: (specialMerchantCoupon?.percentageDiscount || 0) * subtotal

	const pppDiscountAmount = expectedPPPDiscountPercent * subtotal

	const pppDiscountIsBetter = merchantDiscountAmount < pppDiscountAmount

	const pppConditionsMet =
		expectedPPPDiscountPercent > 0 &&
		quantity === 1 &&
		hasOnlyPPPDiscountedPurchases &&
		pppDiscountIsBetter

	// Lookup PPP coupon when:
	// 1. No merchant coupon was provided at all (auto-apply PPP), OR
	// 2. A fixed-amount coupon was provided AND PPP is better (override fixed with PPP)
	// NOTE: For percentage coupons, respect user's explicit choice - don't override
	const isFixedAmountCoupon =
		specialMerchantCoupon?.amountDiscount !== null &&
		specialMerchantCoupon?.amountDiscount !== undefined &&
		specialMerchantCoupon?.amountDiscount > 0

	const shouldLookupPPPMerchantCoupon =
		appliedMerchantCoupon?.type !== PPP_TYPE && // Don't lookup if already PPP
		autoApplyPPP &&
		pppConditionsMet && // PPP conditions must be met
		(appliedMerchantCoupon === null || isFixedAmountCoupon) // No coupon OR fixed-amount coupon

	let pppMerchantCoupon: MerchantCoupon | null = null
	if (shouldLookupPPPMerchantCoupon) {
		pppMerchantCoupon = await lookupApplicablePPPMerchantCoupon({
			prismaCtx,
			pppDiscountPercent: expectedPPPDiscountPercent,
			country,
		})
	}

	const pppCouponToBeApplied =
		appliedMerchantCoupon?.type === PPP_TYPE
			? appliedMerchantCoupon
			: pppMerchantCoupon

	// Build `details` with all kinds of intermediate stuff as part of this refactoring
	const pppApplied =
		quantity === 1 &&
		appliedMerchantCoupon?.type === 'ppp' &&
		expectedPPPDiscountPercent > 0

	// NOTE: PPP coupons are only *available* if the conditions are met
	// which includes that the PPP discount will be better than any
	// site-wide default coupon.
	let availableCoupons: Awaited<ReturnType<typeof couponForType>> = []
	if (pppConditionsMet) {
		availableCoupons = await couponForType(
			PPP_TYPE,
			expectedPPPDiscountPercent,
			prismaCtx,
			country,
		)
	}

	const baseDetails = {
		pppApplied: false,
		pppCouponToBeApplied: null,
		availableCoupons,
	}
	if (pppCouponToBeApplied === null) {
		return {
			...baseDetails,
			status: NO_PPP,
		}
	}

	// Check *applied* PPP coupon validity
	const couponPercentDoesNotMatchCountry =
		expectedPPPDiscountPercent !== pppCouponToBeApplied?.percentageDiscount
	const couponPercentOutOfRange =
		expectedPPPDiscountPercent <= 0 || expectedPPPDiscountPercent >= 1
	const pppAppliedToBulkPurchase = quantity > 1
	const invalidCoupon =
		couponPercentDoesNotMatchCountry ||
		couponPercentOutOfRange ||
		pppAppliedToBulkPurchase

	if (invalidCoupon) {
		return {
			...baseDetails,
			status: INVALID_PPP,
			availableCoupons: [],
		}
	}

	return {
		...baseDetails,
		status: VALID_PPP,
		pppApplied,
		pppCouponToBeApplied,
	}
}

const LookupApplicablePPPMerchantCouponParamsSchema = z.object({
	prismaCtx: PrismaCtxSchema,
	pppDiscountPercent: z.number(),
	country: z.string(),
})
type LookupApplicablePPPMerchantCouponParams = z.infer<
	typeof LookupApplicablePPPMerchantCouponParamsSchema
>

// TODO: Should we cross-check the incoming `pppDiscountPercent` with
// the `discountPercentage` that was applied to the original purchase?
const lookupApplicablePPPMerchantCoupon = async (
	params: LookupApplicablePPPMerchantCouponParams,
) => {
	const { prismaCtx, pppDiscountPercent, country } =
		LookupApplicablePPPMerchantCouponParamsSchema.parse(params)

	const pppCoupons = await couponForType(
		PPP_TYPE,
		pppDiscountPercent,
		prismaCtx,
		country,
	)

	// early return if there is no PPP coupon that fits the bill
	// report this to Sentry? Seems like a bug if we aren't able to find one.
	if (pppCoupons.length === 0) return null

	return pppCoupons[0]
}

const GetBulkCouponDetailsParamsSchema = z.object({
	prismaCtx: PrismaCtxSchema,
	userId: z.string().optional(),
	productId: z.string(),
	quantity: z.number(),
	appliedMerchantCoupon: MerchantCouponSchema.nullable(),
	pppApplied: z.boolean(),
	unitPrice: z.number(),
})
type GetBulkCouponDetailsParams = z.infer<
	typeof GetBulkCouponDetailsParamsSchema
>
const getBulkCouponDetails = async (params: GetBulkCouponDetailsParams) => {
	const {
		prismaCtx,
		userId,
		productId,
		quantity,
		appliedMerchantCoupon,
		pppApplied,
		unitPrice,
	} = GetBulkCouponDetailsParamsSchema.parse(params)

	// Determine if the user has an existing bulk purchase of this product.
	// If so, we can compute tiered pricing based on their existing seats purchased.
	const seatCount = await getQualifyingSeatCount({
		userId,
		productId,
		newPurchaseQuantity: quantity,
		prismaCtx,
	})

	const consideredBulk = seatCount > 1

	const bulkCouponPercent = getBulkDiscountPercent(seatCount)

	// Compare bulk discount vs merchant coupon by calculating actual discount amounts
	const subtotal = unitPrice * quantity
	const merchantDiscountAmount =
		appliedMerchantCoupon?.amountDiscount !== null &&
		appliedMerchantCoupon?.amountDiscount !== undefined &&
		appliedMerchantCoupon?.amountDiscount > 0
			? (appliedMerchantCoupon.amountDiscount / 100) * quantity // Convert cents to dollars and apply per seat
			: (appliedMerchantCoupon?.percentageDiscount || 0) * subtotal

	const bulkDiscountAmount = bulkCouponPercent * subtotal

	const bulkDiscountIsBetter = merchantDiscountAmount < bulkDiscountAmount

	const bulkDiscountAvailable =
		bulkCouponPercent > 0 && bulkDiscountIsBetter && !pppApplied // this condition seems irrelevant, if quantity > 1 OR seatCount > 1

	if (bulkDiscountAvailable) {
		const bulkCoupons = await couponForType(
			BULK_TYPE,
			bulkCouponPercent,
			prismaCtx,
		)
		const bulkCoupon = bulkCoupons[0]

		return { bulkCouponToBeApplied: bulkCoupon, consideredBulk }
	} else {
		return { bulkCouponToBeApplied: null, consideredBulk }
	}
}

const getQualifyingSeatCount = async ({
	userId,
	productId: purchasingProductId,
	newPurchaseQuantity,
	prismaCtx,
}: {
	userId: string | undefined
	productId: string
	newPurchaseQuantity: number
	prismaCtx: CourseBuilderAdapter
}) => {
	const { getPurchasesForUser } = prismaCtx
	const userPurchases = await getPurchasesForUser(userId)
	const bulkPurchase = userPurchases.find(
		({ productId, bulkCoupon, status }) =>
			productId === purchasingProductId &&
			Boolean(bulkCoupon) &&
			(status === 'Valid' || status === 'Restricted'), // Exclude refunded purchases
	)

	const existingSeatsPurchasedForThisProduct =
		bulkPurchase?.bulkCoupon?.maxUses || 0

	return newPurchaseQuantity + existingSeatsPurchasedForThisProduct
}

async function couponForType(
	type: string,
	percentageDiscount: number,
	prismaCtx: CourseBuilderAdapter,
	country?: string,
) {
	const { getMerchantCouponsForTypeAndPercent } = prismaCtx
	const merchantCoupons =
		(await getMerchantCouponsForTypeAndPercent({ type, percentageDiscount })) ||
		[]

	return merchantCoupons.map((coupon: MerchantCoupon) => {
		// for pricing we don't need the identifier so strip it here
		const { identifier, ...rest } = coupon
		return { ...rest, ...(country && { country }) }
	})
}
