import { createHash } from 'crypto'
import { AuthConfig } from '@auth/core'
import type { EmailConfig } from '@auth/core/src/providers'
import { Theme } from '@auth/core/types'
import { v4 } from 'uuid'

import { CourseBuilderAdapter } from '../adapters'
import type {
	HTMLEmailParams,
	MagicLinkEmailType,
} from './send-verification-request'
import { sendVerificationRequest } from './send-verification-request'

function hashToken(token: string, options: any) {
	const { provider, secret } = options
	return (
		createHash('sha256')
			// Prefer provider specific secret, but use default secret if none specified!
			.update(`${token}${provider.secret ?? secret}`)
			.digest('hex')
	)
}

export async function createVerificationUrl({
	email,
	emailProvider,
	adapter,
	callbackUrl,
	expiresAt,
	authOptions,
	baseUrl,
}: {
	email: string
	authOptions: AuthConfig
	emailProvider: EmailConfig
	adapter: CourseBuilderAdapter
	callbackUrl?: string
	baseUrl: string
	expiresAt?: Date
}) {
	if (!emailProvider) return

	callbackUrl = (callbackUrl || baseUrl) as string

	const token = (await emailProvider.generateVerificationToken?.()) ?? v4()

	const ONE_DAY_IN_SECONDS = 86400
	const durationInMilliseconds =
		(emailProvider.maxAge ?? ONE_DAY_IN_SECONDS) * 1000
	const expires = expiresAt || new Date(Date.now() + durationInMilliseconds)

	await adapter.createVerificationToken?.({
		identifier: email,
		token: hashToken(token, {
			provider: emailProvider,
			secret: authOptions.secret,
		}),
		expires,
	})

	const params = new URLSearchParams({ callbackUrl, token, email })
	const verificationUrl = `${baseUrl}/api/auth/callback/${emailProvider.id}?${params}`

	return { url: verificationUrl, token, expires }
}

export async function sendServerEmail({
	email,
	callbackUrl,
	emailProvider,
	type = 'login',
	html,
	text,
	expiresAt,
	authOptions,
	adapter,
	baseUrl,
	merchantChargeId,
}: {
	authOptions: AuthConfig
	email: string
	callbackUrl: string
	emailProvider?: EmailConfig
	type?: MagicLinkEmailType
	html?: (options: HTMLEmailParams, theme?: Theme) => string
	text?: (options: HTMLEmailParams, theme?: Theme) => string
	expiresAt?: Date | null
	adapter: CourseBuilderAdapter
	baseUrl: string
	merchantChargeId?: string | null
}) {
	if (!emailProvider) return
	try {
		const verificationDetails = await createVerificationUrl({
			email,
			authOptions,
			callbackUrl,
			emailProvider,
			expiresAt: expiresAt || undefined,
			adapter,
			baseUrl,
		})

		if (!verificationDetails) return

		const { url, token, expires } = verificationDetails

		await sendVerificationRequest(
			{
				identifier: email,
				url,
				theme: { colorScheme: 'auto' },
				provider: emailProvider,
				token: token as string,
				expires,
				type,
				html,
				text,
				merchantChargeId,
			},
			adapter,
		)
	} catch (error: any) {
		console.error(error)
		throw new Error('Unable to sendVerificationRequest')
	}
}
