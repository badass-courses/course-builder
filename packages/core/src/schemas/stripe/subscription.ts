import { z } from 'zod'

export const stripeSubscriptionSchema = z.object({
	id: z.string(),
	object: z.literal('subscription'),
	status: z.enum([
		'active',
		'past_due',
		'unpaid',
		'canceled',
		'incomplete',
		'incomplete_expired',
		'trialing',
		'paused',
	]),
	customer: z.string(),
	current_period_end: z.number().optional(),
	cancel_at: z.number().nullable().optional(),
	cancel_at_period_end: z.boolean().optional(),
	items: z.object({
		data: z.array(
			z.object({
				id: z.string(),
				price: z.object({
					id: z.string(),
					product: z.string(),
				}),
			}),
		),
	}),
})
