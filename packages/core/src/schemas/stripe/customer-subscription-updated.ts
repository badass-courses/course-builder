import { z } from 'zod'

import { stripeSubscriptionSchema } from './subscription'

export const customerSubscriptionUpdatedEvent = z.object({
	id: z.string(),
	object: z.literal('event'),
	type: z.literal('customer.subscription.updated'),
	data: z.object({
		object: stripeSubscriptionSchema,
		previous_attributes: z.record(z.unknown()).optional(),
	}),
})

export type CustomerSubscriptionUpdatedEvent = z.infer<
	typeof customerSubscriptionUpdatedEvent
>
