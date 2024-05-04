import process from 'process'
import { NodemailerConfig } from '@auth/core/providers/nodemailer'
import { Theme } from '@auth/core/types'
import { render } from '@react-email/components'
import { createTransport } from 'nodemailer'

import { PostPurchaseLoginEmail } from '@coursebuilder/email-templates/emails/post-purchase-login'

import { CourseBuilderAdapter } from '../adapters'

export type MagicLinkEmailType =
	| 'login'
	| 'signup'
	| 'reset'
	| 'purchase'
	| 'upgrade'
	| 'transfer'

export type HTMLEmailParams = Record<'url' | 'host' | 'email', string> & {
	expires?: Date
	merchantChargeId?: string | null
}

function isValidateEmailServerConfig(server: any) {
	console.log('server', server)
	return Boolean(
		server &&
			server.host &&
			server.port &&
			server.auth?.user &&
			server.auth?.pass,
	)
}

export interface SendVerificationRequestParams {
	identifier: string
	url: string
	expires: Date
	provider: any
	token: string
	theme?: Theme
}

export const sendVerificationRequest = async (
	params: SendVerificationRequestParams & {
		type?: MagicLinkEmailType
		merchantChargeId?: string | null
		html?: (options: HTMLEmailParams, theme?: Theme) => string
		text?: (options: HTMLEmailParams, theme?: Theme) => string
	},
	adapter: CourseBuilderAdapter,
) => {
	const {
		identifier: email,
		url,
		provider,
		text = defaultText,
		html = defaultHtml,
		theme,
		expires,
		merchantChargeId,
	} = params
	const { host } = new URL(url)

	const { server, from } = provider.options ? provider.options : provider

	const { getUserByEmail, findOrCreateUser } = adapter

	let subject

	switch (params.type) {
		case 'purchase':
			subject = `Thank you for Purchasing ${
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE
			} (${host})`
			break
		case 'transfer':
			subject = `Accept Your Seat for ${
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE
			} (${host})`
			break
		default:
			subject = `Log in to ${
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE
			} (${host})`
	}

	const user = process.env.CREATE_USER_ON_LOGIN
		? await findOrCreateUser(email)
		: await getUserByEmail?.(email)

	if (!user) return

	if (process.env.LOG_VERIFICATION_URL) {
		console.log(`\n👋 MAGIC LINK URL ******************\n`)
		console.log(url)
		console.log(`\n************************************\n`)
	}

	if (
		isValidateEmailServerConfig(server) &&
		process.env.SKIP_EMAIL !== 'true'
	) {
		const transport = createTransport(server)

		const result = await transport.sendMail({
			to: email,
			from,
			subject,
			text: text({ url, host, email, expires, merchantChargeId }, theme),
			html: html({ url, host, email, expires, merchantChargeId }, theme),
		})
		console.debug(`📧 Email sent to ${email}! [${result.response}]`)
	} else if (process.env.SKIP_EMAIL === 'true') {
		console.warn(`🚫 email sending is disabled.`)
	} else {
		console.warn(
			`🚫 Invalid email server config. Do you need a POSTMARK_KEY env var?`,
		)
	}
}

function defaultHtml(
	{ url, host, email, merchantChargeId }: HTMLEmailParams,
	theme?: Theme,
) {
	return render(
		PostPurchaseLoginEmail(
			{
				url,
				host,
				email,
				siteName:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'',
				...(merchantChargeId && {
					invoiceUrl: `${process.env.COURSEBUILDER_URL}/invoices/${merchantChargeId}`,
				}),
				previewText:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'login link',
			},
			theme,
		),
	)
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
function defaultText(
	{ url, host, email, merchantChargeId }: HTMLEmailParams,
	theme?: Theme,
) {
	return render(
		PostPurchaseLoginEmail(
			{
				url,
				host,
				email,
				siteName:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'',
				...(merchantChargeId && {
					invoiceUrl: `${process.env.COURSEBUILDER_URL}/invoices/${merchantChargeId}`,
				}),
				previewText:
					process.env.NEXT_PUBLIC_PRODUCT_NAME ||
					process.env.NEXT_PUBLIC_SITE_TITLE ||
					'login link',
			},
			theme,
		),
		{
			plainText: true,
		},
	)
}
