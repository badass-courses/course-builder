import { StripePaymentAdapter } from '@/coursebuilder/stripe-payment-adapter'
import { env } from '@/env.mjs'

import StripeProvider from '@coursebuilder/core/providers/stripe'

export const stripeProvider = StripeProvider({
	errorRedirectUrl: `${env.COURSEBUILDER_URL}/checkout-error`,
	baseSuccessUrl: `${env.COURSEBUILDER_URL}/checkout-success`,
	cancelUrl: `${env.COURSEBUILDER_URL}/checkout-cancel`,
	paymentsAdapter: new StripePaymentAdapter(),
})
