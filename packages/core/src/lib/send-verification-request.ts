import { Theme } from '@auth/core/types'
import { render } from '@react-email/components'

import { NewMemberEmail } from '@coursebuilder/email-templates/emails/new-member'
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
	name?: string
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
		html?: (options: HTMLEmailParams, theme?: Theme) => Promise<string>
		text?: (options: HTMLEmailParams, theme?: Theme) => Promise<string>
	},
	adapter: CourseBuilderAdapter,
) => {
	const {
		identifier: email,
		name,
		url,
		provider,
		theme,
		expires,
		merchantChargeId,
		type = 'login',
	} = params

	const { host } = new URL(url)
	console.log(
		`[sendVerificationRequest] Initiated. Type: ${type}, Email: ${email}, Host: ${host}${merchantChargeId ? `, MerchantChargeId: ${merchantChargeId}` : ''}`,
	)

	let text = params.text || defaultText
	let html = params.html || defaultHtml

	const { server, from } = provider.options ? provider.options : provider

	const { getUserByEmail, findOrCreateUser } = adapter

	let subject

	switch (type) {
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
		case 'signup':
			subject = `Welcome to ${
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE
			} (${host})`
			html = signUpHtml
			text = signUpText
			break
		default:
			subject = `Log in to ${
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE
			} (${host})`
	}

	console.log(
		`[sendVerificationRequest] Determined email subject: "${subject}"`,
	)

	let user: any
	try {
		user = process.env.CREATE_USER_ON_LOGIN
			? await findOrCreateUser(email, name)
			: await getUserByEmail?.(email)

		if (!user) {
			console.warn(
				`[sendVerificationRequest] User not found and creation disabled/failed for email: ${email}. Aborting.`,
			)
			return
		}
		console.log(
			`[sendVerificationRequest] User found or created for email: ${email}, ID: ${user.id || user?.user?.id || 'unknown'}`,
		)
	} catch (error: any) {
		console.error(
			`[sendVerificationRequest] Error during user lookup/creation for email: ${email}`,
			error,
		)
		throw error
	}

	if (process.env.LOG_VERIFICATION_URL) {
		console.log(`
[sendVerificationRequest] 👋 MAGIC LINK URL ******************
`)
		console.log(url)
		console.log(`
************************************
`)
	}

	if (process.env.SKIP_EMAIL === 'true') {
		console.warn(
			`[sendVerificationRequest] 🚫 Email sending is disabled via SKIP_EMAIL.`,
		)
		return
	}

	if (!process.env.POSTMARK_API_TOKEN && !process.env.POSTMARK_KEY) {
		console.error(
			'[sendVerificationRequest] 🚫 Missing Postmark API Key (POSTMARK_API_TOKEN or POSTMARK_KEY). Cannot send email.',
		)
		throw new Error('Missing Postmark API Key')
	}

	try {
		const textBody = await text(
			{ url, host, email, expires, merchantChargeId },
			theme,
		)
		const htmlBody = await html(
			{ url, host, email, expires, merchantChargeId },
			theme,
		)

		console.log(
			`[sendVerificationRequest] Attempting to send email via Postmark to ${email} from ${from}`,
		)

		const res = await fetch('https://api.postmarkapp.com/email', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Postmark-Server-Token': (process.env.POSTMARK_API_TOKEN ||
					process.env.POSTMARK_KEY) as string,
			},
			body: JSON.stringify({
				From: from,
				To: email,
				Subject: subject,
				TextBody: textBody,
				HtmlBody: htmlBody,
				MessageStream: 'outbound',
			}),
		})

		if (!res.ok) {
			const errorBody = await res.json()
			console.error(
				`[sendVerificationRequest] Postmark error sending email to ${email}. Status: ${res.status}`,
				errorBody,
			)
			throw new Error(
				`Postmark error: ${res.status} ${JSON.stringify(errorBody)}`,
			)
		}

		console.log(
			`[sendVerificationRequest] ✅ Email successfully sent to ${email} via Postmark. Status: ${res.status}`,
		)
	} catch (error: any) {
		console.error(
			`[sendVerificationRequest] 💥 Failed to send email to ${email}. Error:`,
			error,
		)
		throw error
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
async function defaultText(
	{ url, host, email, merchantChargeId }: HTMLEmailParams,
	theme?: Theme,
) {
	return await render(
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

async function signUpHtml(
	{ url, host, email }: HTMLEmailParams,
	theme?: Theme,
) {
	return await render(
		NewMemberEmail({
			url,
			host,
			email,
			siteName:
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE ||
				'',
		}),
	)
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
async function signUpText(
	{ url, host, email }: HTMLEmailParams,
	theme?: Theme,
) {
	return await render(
		NewMemberEmail({
			url,
			host,
			email,
			siteName:
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE ||
				'',
		}),
		{
			plainText: true,
		},
	)
}
