import { z } from 'zod'

export const CheckoutSessionMetadataSchema = z.object({
	upgradeFromPurchaseId: z.string().optional(),
	bulk: z.enum(['true', 'false']),
	appliedPPPStripeCouponId: z.string().optional(),
	upgradedFromPurchaseId: z.string().optional(),
	country: z.string().default('US'),
	ip_address: z.string().default(''),
	usedCouponId: z.string().optional(),
	productId: z.string(),
	product: z.string(),
	userId: z.string().optional(),
	siteName: z.string(),
	organizationId: z.string().optional(),
})
export type CheckoutSessionMetadata = z.infer<
	typeof CheckoutSessionMetadataSchema
>
