import { emailProvider } from '@/coursebuilder/email-provider'
import { openaiProvider } from '@/coursebuilder/openai-provider'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { transcriptProvider } from '@/coursebuilder/transcript-provider'
import { courseBuilderAdapter } from '@/db'
import { inngest } from '@/inngest/inngest.server'
import { getServerAuthSession } from '@/server/auth'

import { userSchema } from '@coursebuilder/core/schemas'
import NextCourseBuilder, {
	type NextCourseBuilderConfig,
} from '@coursebuilder/next'

export const courseBuilderConfig: NextCourseBuilderConfig = {
	adapter: courseBuilderAdapter,
	inngest,
	providers: [
		transcriptProvider,
		openaiProvider,
		stripeProvider,
		emailProvider,
	],
	basePath: '/api/coursebuilder',
	callbacks: {
		session: async (req) => {
			// TODO: there's nothing on the "session" but we can add whatever we want here
			return { ...req, example: 'just an example' }
		},
	},
	getCurrentUser: async () => {
		const { session } = await getServerAuthSession()
		if (!session?.user) return null

		return userSchema.parse(session.user)
	},
}

export const {
	handlers: { POST, GET },
	coursebuilder,
} = NextCourseBuilder(courseBuilderConfig)
