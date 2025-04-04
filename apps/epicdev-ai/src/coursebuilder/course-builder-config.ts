import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { emailProvider } from '@/coursebuilder/email-provider'
import { openaiProvider } from '@/coursebuilder/openai-provider'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { transcriptProvider } from '@/coursebuilder/transcript-provider'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { authOptions } from '@/server/auth'

import NextCourseBuilder, {
	type NextCourseBuilderConfig,
} from '@coursebuilder/next'

export const courseBuilderConfig: NextCourseBuilderConfig = {
	baseUrl: env.COURSEBUILDER_URL,
	adapter: courseBuilderAdapter,
	inngest,
	providers: [
		transcriptProvider,
		emailListProvider,
		openaiProvider,
		emailProvider,
		stripeProvider,
	],
	basePath: '/api/coursebuilder',
	callbacks: {
		session: async (req) => {
			// TODO: there's nothing on the "session" but we can add whatever we want here
			return { ...req, example: 'just an example' }
		},
	},
	authConfig: authOptions,
}

export const {
	handlers: { POST, GET },
	coursebuilder,
} = NextCourseBuilder(courseBuilderConfig)
