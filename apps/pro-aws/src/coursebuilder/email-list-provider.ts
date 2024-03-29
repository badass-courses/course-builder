import { env } from '@/env.mjs'

import ConvertkitProvider from '@coursebuilder/core/providers/convertkit'

export const emailListProvider = ConvertkitProvider({
	apiKey: env.CONVERTKIT_API_KEY,
	apiSecret: env.CONVERTKIT_API_SECRET,
	defaultListType: 'form',
	defaultListId: env.CONVERTKIT_SIGNUP_FORM,
})
