import { z } from 'zod'

export const REFUND_PROCESSED_EVENT = 'commerce/refund-processed'

export type RefundProcessed = {
	name: typeof REFUND_PROCESSED_EVENT
	data: RefundProcessedEvent
}

export const RefundProcessedEventSchema = z.object({
	merchantChargeId: z.string(),
})

export type RefundProcessedEvent = z.infer<typeof RefundProcessedEventSchema>
