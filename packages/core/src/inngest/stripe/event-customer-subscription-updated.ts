import { CustomerSubscriptionUpdatedEvent } from 'src/schemas/stripe/customer-subscription-updated'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'

export const STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT =
	'stripe/customer-subscription-updated'

export type StripeCustomerSubscriptionUpdated = {
	name: typeof STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT
	data: {
		stripeEvent: CustomerSubscriptionUpdatedEvent
	}
}

export const stripeCustomerSubscriptionUpdatedConfig = {
	id: 'stripe-customer-subscription-updated',
	name: 'Stripe Customer Subscription Updated',
}

export const stripeCustomerSubscriptionUpdatedTrigger: CoreInngestTrigger = {
	event: STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT,
}

export const stripeCustomerSubscriptionUpdatedHandler: CoreInngestHandler =
	async ({ event, step, db }: CoreInngestFunctionInput) => {
		const subscription = event.data.stripeEvent.data.object
		const previousAttributes = event.data.stripeEvent.data.previous_attributes

		// Handle status changes
		if (previousAttributes?.status) {
			await step.run('handle subscription status change', async () => {
				// TODO: Update subscription status in our database
				// TODO: Handle cancellations, reactivations, etc.
			})
		}

		// Handle plan changes
		if (previousAttributes?.items) {
			await step.run('handle subscription plan change', async () => {
				// TODO: Update subscription plan in our database
				// TODO: Handle any necessary side effects
			})
		}
	}

export const stripeCustomerSubscriptionUpdated = {
	config: stripeCustomerSubscriptionUpdatedConfig,
	trigger: stripeCustomerSubscriptionUpdatedTrigger,
	handler: stripeCustomerSubscriptionUpdatedHandler,
}
