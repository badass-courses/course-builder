import { z } from 'zod'

/**
 * Schema for MerchantEvents table - tracks webhook events from payment providers
 * This provides an audit trail of what webhooks we received, regardless of
 * whether Inngest successfully processed them or not.
 */
export const merchantEventsSchema = z.object({
	id: z.string().max(191),
	merchantAccountId: z.string().max(191),
	identifier: z.string().max(191), // Stripe event ID or other provider event ID
	payload: z.record(z.any()), // Raw webhook payload as JSON
	createdAt: z.date().nullable(),
})

export type MerchantEvents = z.infer<typeof merchantEventsSchema>
