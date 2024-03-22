import { db } from '@/db'
import { mysqlTable } from '@/db/mysql-table'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'
import { type CourseBuilderConfig } from '@coursebuilder/core'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'
import NextCourseBuilder from '@coursebuilder/next'

const callbackBase =
	env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL

export const transcriptProvider = DeepgramProvider({
	apiKey: env.DEEPGRAM_API_KEY,
	callbackUrl: `${callbackBase}/api/coursebuilder/webhook/deepgram`,
})

export const courseBuilderConfig: CourseBuilderConfig = {
	adapter: DrizzleAdapter(db, mysqlTable),
	inngest,
	providers: [transcriptProvider],
	basePath: '/api/coursebuilder',
}

export const {
	handlers: { POST, GET },
} = NextCourseBuilder(courseBuilderConfig)
