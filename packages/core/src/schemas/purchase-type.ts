import { z } from 'zod'

export const EXISTING_BULK_COUPON = 'EXISTING_BULK_COUPON'
export const NEW_BULK_COUPON = 'NEW_BULK_COUPON'
export const NEW_INDIVIDUAL_PURCHASE = 'NEW_INDIVIDUAL_PURCHASE'
export const INDIVIDUAL_TO_BULK_UPGRADE = 'INDIVIDUAL_TO_BULK_UPGRADE'

export const purchaseTypeSchema = z.union([
	z.literal(EXISTING_BULK_COUPON),
	z.literal(NEW_BULK_COUPON),
	z.literal(NEW_INDIVIDUAL_PURCHASE),
	z.literal(INDIVIDUAL_TO_BULK_UPGRADE),
])
export type PurchaseType = z.infer<typeof purchaseTypeSchema>
