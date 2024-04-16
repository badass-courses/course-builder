import Stripe from 'stripe'

import { CourseBuilderAdapter } from '../adapters'
import { CheckoutParams, stripeCheckout } from '../lib/pricing/stripe-checkout'

export interface StripeProviderConfig {
	id: string
	name: string
	type: 'payment'
	options: StripeProviderConsumerConfig
	createCheckoutSession: (
		checkoutParams: CheckoutParams,
		adapter?: CourseBuilderAdapter,
	) => Promise<{ redirect: string; status: number }>
}

export interface PaymentsAdapter {
	/**
	 * Returns the percent off for a given coupon
	 * @param identifier
	 */
	getCouponPercentOff(identifier: string): Promise<number>
	/**
	 * Returns a coupon id.
	 *
	 * TODO: these use the stripe types and we probably want to use an
	 *   internal interface so that we can think about different providers
	 *   in the future.
	 * @param params
	 */
	createCoupon(params: Stripe.CouponCreateParams): Promise<string>
	/**
	 * Returns a promotion code.
	 * @param params
	 */
	createPromotionCode(params: Stripe.PromotionCodeCreateParams): Promise<string>
	/**
	 * Returns the URL to redirect to for a checkout session.
	 * @param params
	 */
	createCheckoutSession(
		params: Stripe.Checkout.SessionCreateParams,
	): Promise<string | null>
	createCustomer(params: Stripe.CustomerCreateParams): Promise<string>
}

export type StripeProviderConsumerConfig = Omit<
	Partial<StripeProviderConfig>,
	'options' | 'type'
> & {
	paymentsAdapter: PaymentsAdapter
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
	} as const
}

export const MockStripeProvider: StripeProviderConfig = {
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
		},
	},
	createCheckoutSession: async () => {
		return {
			redirect: 'mock-checkout-session-id',
			status: 303,
		}
	},
}
