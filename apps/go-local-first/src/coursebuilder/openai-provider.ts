import { env } from '@/env.mjs'

import OpenAIProvider from '@coursebuilder/core/providers/openai'

export const openaiProvider = OpenAIProvider({
	apiKey: env.OPENAI_API_KEY,
	partyUrlBase: env.NEXT_PUBLIC_PARTY_KIT_URL,
})
