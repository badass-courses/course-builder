import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import EmailProvider from 'next-auth/providers/nodemailer'

import { sendVerificationRequest } from '@coursebuilder/core/lib/send-verification-request'

export const emailProvider = EmailProvider({
	from: 'team@proaws.dev',
	sendVerificationRequest: (params) => {
		return sendVerificationRequest(params, courseBuilderAdapter)
	},
	server: {
		host: env.EMAIL_SERVER_HOST,
		port: Number(env.EMAIL_SERVER_PORT),
		auth: {
			user: env.POSTMARK_KEY,
			pass: env.POSTMARK_KEY,
		},
	},
})
