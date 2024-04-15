import { CheckoutParams } from '../lib/pricing/stripe-checkout'

export interface StripeProviderConfig {
	id: string
	name: string
	type: 'payment'
	options: StripeProviderConsumerConfig
	createCheckoutSession: (checkoutParams: CheckoutParams) => Promise<string>
}

export type StripeProviderConsumerConfig = Omit<
	Partial<StripeProviderConfig>,
	'options' | 'type'
> & {
	apiKey: string
	errorRedirectUrl: string
	cancelUrl: string
	baseSuccessUrl: string
}

export default function StripeProvider(
	options: StripeProviderConsumerConfig,
): StripeProviderConfig {
	return {
		id: 'stripe',
		name: 'Stripe',
		type: 'payment',
		options,
		...options,
		createCheckoutSession: async (checkoutParams: CheckoutParams) => {
			return Promise.resolve('mock-checkout-session-id')
		},
	} as const
}

export const MockStripeProvider: StripeProviderConfig = {
	id: 'mock-stripe' as const,
	name: 'Mock Stripe',
	type: 'payment',
	options: {
		apiKey: 'mock-api-key',
		errorRedirectUrl: 'mock-error-redirect-url',
		cancelUrl: 'mock-cancel-url',
		baseSuccessUrl: 'mock-base-success-url',
	},
	createCheckoutSession: async () => {
		return Promise.resolve('mock-checkout-session-id')
	},
}
