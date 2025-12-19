import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import Postmark from 'next-auth/providers/postmark'

import { sendVerificationRequest } from '@coursebuilder/core/lib/send-verification-request'

export const emailProvider = Postmark({
	apiKey: env.POSTMARK_API_KEY,
	from: env.NEXT_PUBLIC_SUPPORT_EMAIL,
	sendVerificationRequest: (params) => {
		return sendVerificationRequest(params, courseBuilderAdapter)
	},
})
