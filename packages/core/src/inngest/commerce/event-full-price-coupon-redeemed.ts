import { z } from 'zod'

export const FULL_PRICE_COUPON_REDEEMED_EVENT =
	'commerce/full-price-coupon-redeemed'

export type FullPriceCouponRedeemed = {
	name: typeof FULL_PRICE_COUPON_REDEEMED_EVENT
	data: FullPriceCouponRedeemedEvent
}

export const FullPriceCouponRedeemedEventSchema = z.object({
	purchaseId: z.string(),
	productType: z.enum(['live', 'self-paced', 'membership', 'cohort']),
	checkoutSessionId: z.string(),
})

export type FullPriceCouponRedeemedEvent = z.infer<
	typeof FullPriceCouponRedeemedEventSchema
>
