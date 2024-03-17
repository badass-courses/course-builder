import { env } from '@/env.mjs'

import DeepgramProvider from '@coursebuilder/core/providers/deepgram'

const callbackBase = env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL

export const transcriptProvider = DeepgramProvider({
  apiKey: env.DEEPGRAM_API_KEY,
  callbackUrl: `${callbackBase}/api/deepgram/webhook`,
})
