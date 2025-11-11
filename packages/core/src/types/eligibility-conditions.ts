import { z } from 'zod'

/**
 * Eligibility condition types for stackable discount coupons
 * These conditions determine which users are eligible for a coupon credit
 */
export const eligibilityConditionSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('hasValidProductPurchase'),
		productId: z.string().max(191),
	}),
])

export type EligibilityCondition = z.infer<typeof eligibilityConditionSchema>

/**
 * Extended coupon fields type that includes eligibility conditions and stacking configuration
 */
export const couponFieldsSchema = z.object({
	eligibilityCondition: eligibilityConditionSchema.optional(),
	stackable: z.boolean().optional(),
})

export type CouponFields = z.infer<typeof couponFieldsSchema>
