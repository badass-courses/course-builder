import { z } from 'zod'

import { CourseBuilderAdapter, MockCourseBuilderAdapter } from '../../adapters'
import { MerchantCoupon, Purchase } from '../../schemas'
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
	usedCoupon: z
		.object({
			merchantCouponId: z.string().nullable().optional(),
			restrictedToProductId: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
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
		usedCoupon,
		unitPrice,
	} = DetermineCouponToApplyParamsSchema.parse(params)
	// TODO: What are the lookups and logic checks we can
	// skip when there is no appliedMerchantCouponId?

	const { getMerchantCoupon, getPurchasesForUser } = prismaCtx

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

	return {
		appliedMerchantCoupon: couponToApply || undefined,
		appliedCouponType,
		appliedDiscountType,
		availableCoupons,
		bulk: consideredBulk,
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
