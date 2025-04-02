import { env } from '@/env.mjs'
import EmailProvider from 'next-auth/providers/nodemailer'

export const emailProvider = EmailProvider({
	from: env.NEXT_PUBLIC_SUPPORT_EMAIL,
	server: {
		host: env.EMAIL_SERVER_HOST,
		port: Number(env.EMAIL_SERVER_PORT),
		auth: {
			user: env.POSTMARK_KEY,
			pass: env.POSTMARK_KEY,
		},
	},
})
