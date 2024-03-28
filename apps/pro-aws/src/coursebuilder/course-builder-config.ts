import { transcriptProvider } from '@/coursebuilder/transcript-provider'
import { courseBuilderAdapter } from '@/db'
import { inngest } from '@/inngest/inngest.server'

import NextCourseBuilder, {
	type NextCourseBuilderConfig,
} from '@coursebuilder/next'

export const courseBuilderConfig: NextCourseBuilderConfig = {
	adapter: courseBuilderAdapter,
	inngest,
	providers: [transcriptProvider],
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
