import { CustomerSubscriptionCreatedEvent } from 'src/schemas/stripe/customer-subscription-created'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'

export const STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT =
	'stripe/customer-subscription-created'

export type StripeCustomerSubscriptionCreated = {
	name: typeof STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT
	data: {
		stripeEvent: CustomerSubscriptionCreatedEvent
	}
}

export const stripeCustomerSubscriptionCreatedConfig = {
	id: 'stripe-customer-subscription-created',
	name: 'Stripe Customer Subscription Created',
}

export const stripeCustomerSubscriptionCreatedTrigger: CoreInngestTrigger = {
	event: STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT,
}

export const stripeCustomerSubscriptionCreatedHandler: CoreInngestHandler =
	async ({ event, step, db }: CoreInngestFunctionInput) => {
		const subscription = event.data.stripeEvent.data.object

		// Validate subscription status
		if (
			subscription.status !== 'active' &&
			subscription.status !== 'trialing'
		) {
			return
		}

		// TODO: Update subscription status in our database
		// TODO: Handle any necessary side effects (notifications, etc.)
	}

export const stripeCustomerSubscriptionCreated = {
	config: stripeCustomerSubscriptionCreatedConfig,
	trigger: stripeCustomerSubscriptionCreatedTrigger,
	handler: stripeCustomerSubscriptionCreatedHandler,
}
