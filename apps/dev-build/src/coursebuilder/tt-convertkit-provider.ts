import { env } from '@/env.mjs'

import ConvertkitProvider from '@coursebuilder/core/providers/convertkit'

export const ttConvertkitProvider = ConvertkitProvider({
	apiKey: process.env.TT_CONVERTKIT_API_KEY!,
	apiSecret: process.env.TT_CONVERTKIT_API_SECRET!,
})
