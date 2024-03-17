import { db } from '@/db'
import { mysqlTable } from '@/db/schema'
import { env } from '@/env.mjs'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'
import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import { type TranscriptionConfig } from '@coursebuilder/core/providers'
import DeepgramProvider from '@coursebuilder/core/providers/deepgram'

const callbackBase = env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL

interface CourseBuilderConfig {
  adapter: CourseBuilderAdapter
  transcriptProvider: TranscriptionConfig
}

export const courseBuilderConfig: CourseBuilderConfig = {
  adapter: DrizzleAdapter(db, mysqlTable),
  transcriptProvider: DeepgramProvider({
    apiKey: env.DEEPGRAM_API_KEY,
    callbackUrl: `${callbackBase}/api/deepgram/webhook`,
  }),
}
