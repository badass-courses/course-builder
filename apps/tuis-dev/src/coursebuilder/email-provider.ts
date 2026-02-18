import { cookies } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { ConfirmSubscriptionEmail } from '@/emails/confirm-subscription-email'
import { env } from '@/env.mjs'
import { createShortlinkAttribution } from '@/lib/shortlink-attribution'
import { render } from '@react-email/components'
import Postmark from 'next-auth/providers/postmark'

import {
	sendVerificationRequest,
	type HTMLEmailParams,
} from '@coursebuilder/core/lib/send-verification-request'
import { PostPurchaseLoginEmail } from '@coursebuilder/email-templates/emails/post-purchase-login'

type ResourceContext = {
	title?: string
	slug?: string
	callbackUrl?: string
}

function createResourceAwareHtml(resourceContext: ResourceContext) {
	return async ({ url, host, email }: HTMLEmailParams) => {
		const siteName =
			process.env.NEXT_PUBLIC_PRODUCT_NAME ||
			process.env.NEXT_PUBLIC_SITE_TITLE ||
			''

		return render(
			PostPurchaseLoginEmail({
				url,
				host,
				email,
				siteName,
				previewText: resourceContext.title
					? `Log in to access ${resourceContext.title}`
					: `Log in to ${siteName}`,
				resourceTitle: resourceContext.title,
			}),
		)
	}
}

function createResourceAwareText(resourceContext: ResourceContext) {
	return async ({ url, host, email }: HTMLEmailParams) => {
		const siteName =
			process.env.NEXT_PUBLIC_PRODUCT_NAME ||
			process.env.NEXT_PUBLIC_SITE_TITLE ||
			''

		return render(
			PostPurchaseLoginEmail({
				url,
				host,
				email,
				siteName,
				previewText: resourceContext.title
					? `Log in to access ${resourceContext.title}`
					: `Log in to ${siteName}`,
				resourceTitle: resourceContext.title,
			}),
			{ plainText: true },
		)
	}
}

export const emailProvider = Postmark({
	apiKey: env.POSTMARK_API_KEY,
	from: env.NEXT_PUBLIC_SUPPORT_EMAIL,
	sendVerificationRequest: async (params) => {
		let name: string | undefined
		let resourceContext: ResourceContext = {}
		let isSubscribeConfirm = false

		try {
			const body = await params.request.clone().text()
			if (body.startsWith('{')) {
				// NextAuth wraps form data as a JSON string body
				const parsed = JSON.parse(body)
				name = parsed.firstName?.trim() || undefined
				isSubscribeConfirm =
					parsed.subscribeConfirm === true || parsed.subscribeConfirm === 'true'
				resourceContext = {
					title: parsed.resourceTitle?.trim() || undefined,
					slug: parsed.resourceSlug?.trim() || undefined,
					callbackUrl: parsed.callbackUrl?.trim() || undefined,
				}
			} else {
				// Standard form-encoded data (from manual fetch POST)
				const formData = new URLSearchParams(body)
				name = formData.get('firstName')?.trim() || undefined
				isSubscribeConfirm = formData.get('subscribeConfirm') === 'true'
				resourceContext = {
					title: formData.get('resourceTitle')?.trim() || undefined,
					slug: formData.get('resourceSlug')?.trim() || undefined,
					callbackUrl: formData.get('callbackUrl')?.trim() || undefined,
				}
			}
		} catch {
			// Not a form request or parsing failed
		}

		// Subscribe confirmation: send directly via Postmark with custom subject
		if (isSubscribeConfirm) {
			const { identifier: email, url } = params
			const { host } = new URL(url)
			const siteName =
				process.env.NEXT_PUBLIC_PRODUCT_NAME ||
				process.env.NEXT_PUBLIC_SITE_TITLE ||
				''

			const htmlBody = await render(
				ConfirmSubscriptionEmail({ url, host, email, siteName }),
			)
			const textBody = await render(
				ConfirmSubscriptionEmail({ url, host, email, siteName }),
				{ plainText: true },
			)

			if (process.env.SKIP_EMAIL !== 'true') {
				const res = await fetch('https://api.postmarkapp.com/email', {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						'X-Postmark-Server-Token': env.POSTMARK_API_KEY!,
					},
					body: JSON.stringify({
						From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
						To: email,
						Subject: `Confirm your subscription to ${siteName}`,
						TextBody: textBody,
						HtmlBody: htmlBody,
						MessageStream: 'outbound',
					}),
				})

				if (!res.ok) {
					const errorBody = await res.json()
					console.error('Postmark error sending confirmation email:', errorBody)
				}
			}

			return
		}

		// Use appropriate email template based on context
		const emailOptions = resourceContext.title
			? {
					html: createResourceAwareHtml(resourceContext),
					text: createResourceAwareText(resourceContext),
				}
			: {}

		const result = await sendVerificationRequest(
			{ ...params, name, ...emailOptions },
			courseBuilderAdapter,
		)

		// Track shortlink attribution for signups
		try {
			const cookieStore = await cookies()
			const shortlinkSlug = cookieStore.get('sl_ref')?.value
			if (shortlinkSlug && params.identifier) {
				// Fire and forget - don't block the response
				createShortlinkAttribution({
					shortlinkSlug,
					email: params.identifier,
					type: 'signup',
				}).catch((error) => {
					console.error('Failed to record shortlink attribution:', error)
				})
			}
		} catch (error) {
			console.error('Error tracking shortlink attribution:', error)
		}

		return result
	},
})
