import { z } from 'zod'

export const merchantCouponSchema = z.object({
	id: z.string().max(191),
	identifier: z.string().max(191).optional().nullable(),
	status: z.number().int().default(0),
	merchantAccountId: z.string().max(191),
	percentageDiscount: z.number().refine((value) => {
		const decimalPlaces = value.toString().split('.')[1]?.length || 0
		return decimalPlaces <= 2
	}),
	type: z.string().max(191).optional().nullable(),
})

export type MerchantCoupon = z.infer<typeof merchantCouponSchema>
