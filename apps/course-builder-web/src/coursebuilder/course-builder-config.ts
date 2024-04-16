import { openaiProvider } from '@/coursebuilder/openai-provider'
import { StripePaymentAdapter } from '@/coursebuilder/stripe-payment-adapter'
import { transcriptProvider } from '@/coursebuilder/transcript-provider'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'

import StripeProvider from '@coursebuilder/core/providers/stripe'
import NextCourseBuilder, {
	type NextCourseBuilderConfig,
} from '@coursebuilder/next'

const stripeProvider = StripeProvider({
	apiKey: env.STRIPE_SECRET_TOKEN,
	errorRedirectUrl: `${env.COURSEBUILDER_URL}/checkout-error`,
	baseSuccessUrl: `${env.COURSEBUILDER_URL}/checkout-success`,
	cancelUrl: `${env.COURSEBUILDER_URL}/checkout-cancel`,
	paymentsAdapter: new StripePaymentAdapter(),
})

export const courseBuilderConfig: NextCourseBuilderConfig = {
	adapter: courseBuilderAdapter,
	inngest,
	providers: [transcriptProvider, openaiProvider, stripeProvider],
	basePath: '/api/coursebuilder',
	callbacks: {
		session: async (req) => {
			// TODO: there's nothing on the "session" but we can add whatever we want here
			return { ...req, example: 'just an example' }
		},
	},
}

export const {
	handlers: { POST, GET },
	coursebuilder,
} = NextCourseBuilder(courseBuilderConfig)
