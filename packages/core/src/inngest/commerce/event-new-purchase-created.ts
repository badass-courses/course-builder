import { z } from 'zod'

export const NEW_PURCHASE_CREATED_EVENT = 'commerce/new-purchase-created'

export type NewPurchaseCreated = {
	name: typeof NEW_PURCHASE_CREATED_EVENT
	data: NewPurchaseCreatedEvent
}

export const NewPurchaseCreatedEventSchema = z.object({
	purchaseId: z.string(),
	checkoutSessionId: z.string(),
	productType: z.enum(['live', 'self-paced', 'membership', 'cohort']),
})

export type NewPurchaseCreatedEvent = z.infer<
	typeof NewPurchaseCreatedEventSchema
>
