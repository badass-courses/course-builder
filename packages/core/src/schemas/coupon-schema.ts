import { z } from 'zod'

import { couponFieldsSchema } from '../types/eligibility-conditions'

export const couponSchema = z.object({
	id: z.string(),
	code: z.string().max(191).optional().nullable(),
	createdAt: z.date().nullable(),
	expires: z.date().nullable(),
	fields: z
		.record(z.any())
		.default({})
		.refine(
			(fields) => {
				// Validate fields structure if it contains eligibilityCondition or stackable
				if (
					fields.eligibilityCondition !== undefined ||
					fields.stackable !== undefined
				) {
					const result = couponFieldsSchema.safeParse(fields)
					return result.success
				}
				return true
			},
			{
				message:
					'Invalid fields structure. eligibilityCondition must have type and productId, stackable must be boolean.',
			},
		),
	maxUses: z.number().int().default(-1),
	default: z.boolean().default(false),
	merchantCouponId: z.string().max(191).optional().nullable(),
	status: z.number().int().default(0),
	usedCount: z.number().int().default(0),
	percentageDiscount: z.coerce.number().refine((value) => {
		const decimalPlaces = value.toString().split('.')[1]?.length || 0
		return decimalPlaces <= 2
	}),
	amountDiscount: z.coerce.number().int().optional().nullable(),
	restrictedToProductId: z.string().max(191).optional().nullable(),
	bulkPurchases: z.array(z.any()).default([]),
	redeemedBulkCouponPurchases: z.array(z.any()).default([]),
	bulkPurchaseId: z.string().max(191).optional().nullable(), // TODO: remove
	organizationId: z.string().max(191).optional().nullable(),
})

export type Coupon = z.infer<typeof couponSchema>
