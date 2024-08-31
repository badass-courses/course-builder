import { z } from 'zod'

import { purchaseTypeSchema } from './purchase-type'

export const PurchaseMetadata = z.object({
	country: z.string().optional(),
	appliedPPPStripeCouponId: z.string().optional(), // TODO: make this provider agnostic
	upgradedFromPurchaseId: z.string().optional(),
	usedCouponId: z.string().optional(),
})

export const PurchaseInfoSchema = z.object({
	customerIdentifier: z.string(),
	email: z.string().nullable(),
	name: z.string().nullish(),
	productIdentifier: z.string(),
	product: z.object({ name: z.string().nullable() }), // TODO: does this need to surface any other values?
	chargeIdentifier: z.string(),
	couponIdentifier: z.string().optional(),
	quantity: z.number(),
	chargeAmount: z.number(),
	metadata: PurchaseMetadata.passthrough().optional(),
	purchaseType: purchaseTypeSchema,
})
export type PurchaseInfo = z.infer<typeof PurchaseInfoSchema>
