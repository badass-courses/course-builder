import { env } from '@/env.mjs'

import StripeProvider, {
	StripePaymentAdapter,
} from '@coursebuilder/core/providers/stripe'

export const stripeProvider = StripeProvider({
	errorRedirectUrl: `${env.COURSEBUILDER_URL}`,
	baseSuccessUrl: `${env.COURSEBUILDER_URL}`,
	cancelUrl: `${env.COURSEBUILDER_URL}`,
	paymentsAdapter: new StripePaymentAdapter({
		stripeToken: env.STRIPE_SECRET_TOKEN!,
		stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET!,
	}),
})
