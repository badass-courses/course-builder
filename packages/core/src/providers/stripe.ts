import { CourseBuilderAdapter } from '../adapters'
import { CheckoutParams, stripeCheckout } from '../lib/pricing/stripe-checkout'
import {
	PaymentsProviderConfig,
	PaymentsProviderConsumerConfig,
} from '../types'

export default function StripeProvider(
	options: PaymentsProviderConsumerConfig,
): PaymentsProviderConfig {
	console.log({ options })
	return {
		id: 'stripe',
		name: 'Stripe',
		type: 'payment',
		...options,
		options,
		createCheckoutSession: async (
			checkoutParams: CheckoutParams,
			adapter?: CourseBuilderAdapter,
		) => {
			return stripeCheckout({
				params: checkoutParams,
				config: options,
				adapter,
			})
		},
	}
}

export const MockStripeProvider: PaymentsProviderConfig = {
	id: 'mock-stripe' as const,
	name: 'Mock Stripe',
	type: 'payment',
	options: {
		errorRedirectUrl: 'mock-error-redirect-url',
		cancelUrl: 'mock-cancel-url',
		baseSuccessUrl: 'mock-base-success-url',
		paymentsAdapter: {
			getCouponPercentOff: async () => 0,
			createCoupon: async () => 'mock-coupon-id',
			createPromotionCode: async () => 'mock-promotion-code-id',
			createCheckoutSession: async () => 'mock-checkout-session-id',
			createCustomer: async () => 'mock-customer-id',
			verifyWebhookSignature: async () => true,
		},
	},
	createCheckoutSession: async () => {
		return {
			redirect: 'mock-checkout-session-id',
			status: 303,
		}
	},
}
