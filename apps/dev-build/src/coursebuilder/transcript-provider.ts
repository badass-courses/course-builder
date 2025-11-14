import { env } from '@/env.mjs'

import DeepgramProvider from '@coursebuilder/core/providers/deepgram'

export const transcriptProvider = DeepgramProvider({
	apiKey: env.DEEPGRAM_API_KEY,
	callbackUrl: `${env.COURSEBUILDER_URL}/api/coursebuilder/webhook/deepgram`,
})
