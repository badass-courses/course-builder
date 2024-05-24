import { z } from 'zod'

import { merchantCouponSchema } from './merchant-coupon-schema'

export const PricingFormattedInputSchema = z.object({
	productId: z.string().optional(),
	quantity: z.number().optional().default(1),
	couponId: z.string().nullable().optional(),
	merchantCoupon: merchantCouponSchema.optional().nullable(),
	upgradeFromPurchaseId: z.string().optional(),
	autoApplyPPP: z.boolean().default(true),
	country: z.string().optional(),
	userId: z.string().optional(),
})

export type PricingFormattedInput = z.infer<typeof PricingFormattedInputSchema>
