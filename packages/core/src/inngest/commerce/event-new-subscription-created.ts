import { z } from 'zod'

export const NEW_SUBSCRIPTION_CREATED_EVENT =
	'commerce/new-subscription-created'

export type NewSubscriptionCreated = {
	name: typeof NEW_SUBSCRIPTION_CREATED_EVENT
	data: NewSubscriptionCreatedEvent
}

export const NewSubscriptionCreatedEventSchema = z.object({
	subscriptionId: z.string(),
	checkoutSessionId: z.string(),
})

export type NewSubscriptionCreatedEvent = z.infer<
	typeof NewSubscriptionCreatedEventSchema
>
