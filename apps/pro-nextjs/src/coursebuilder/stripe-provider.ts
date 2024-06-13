import { StripePaymentAdapter } from '@/coursebuilder/stripe-payment-adapter'
import { env } from '@/env.mjs'

import StripeProvider from '@coursebuilder/core/providers/stripe'

export const stripeProvider = StripeProvider({
	errorRedirectUrl: `${env.COURSEBUILDER_URL}`,
	baseSuccessUrl: `${env.COURSEBUILDER_URL}`,
	cancelUrl: `${env.COURSEBUILDER_URL}`,
	paymentsAdapter: new StripePaymentAdapter(),
})
