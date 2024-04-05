import { z } from 'zod'

export const couponSchema = z.object({
	id: z.string(),
	code: z.string().max(191).optional().nullable(),
	createdAt: z.string().default(() => new Date().toISOString()),
	expires: z.string().datetime().optional().nullable(),
	metadata: z.record(z.any()).default({}),
	maxUses: z.number().int().default(-1),
	default: z.boolean().default(false),
	merchantCouponId: z.string().max(191).optional().nullable(),
	status: z.number().int().default(0),
	usedCount: z.number().int().default(0),
	percentageDiscount: z.number().refine((value) => {
		const decimalPlaces = value.toString().split('.')[1]?.length || 0
		return decimalPlaces <= 2
	}),
	restrictedToProductId: z.string().max(191).optional().nullable(),
	bulkPurchaseId: z.string().max(191).optional().nullable(),
})

export type Coupon = z.infer<typeof couponSchema>
