import { z } from 'zod'

import { stripeSubscriptionSchema } from '../../schemas/stripe/subscription'

export const customerSubscriptionCreatedEvent = z.object({
	id: z.string(),
	object: z.literal('event'),
	type: z.literal('customer.subscription.created'),
	data: z.object({
		object: stripeSubscriptionSchema,
	}),
})

export type CustomerSubscriptionCreatedEvent = z.infer<
	typeof customerSubscriptionCreatedEvent
>
