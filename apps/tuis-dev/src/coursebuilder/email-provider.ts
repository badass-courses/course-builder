import { cookies } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
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

		try {
			const formData = await params.request.clone().formData()
			// NextAuth transforms form into JSON - first key contains all data
			const firstKey = [...formData.keys()][0]
			if (firstKey?.startsWith('{')) {
				const parsed = JSON.parse(firstKey)
				name = parsed.firstName?.trim() || undefined
				resourceContext = {
					title: parsed.resourceTitle?.trim() || undefined,
					slug: parsed.resourceSlug?.trim() || undefined,
					callbackUrl: parsed.callbackUrl?.trim() || undefined,
				}
			} else {
				// Standard form data
				name = formData.get('firstName')?.toString().trim() || undefined
				resourceContext = {
					title: formData.get('resourceTitle')?.toString().trim() || undefined,
					slug: formData.get('resourceSlug')?.toString().trim() || undefined,
					callbackUrl:
						formData.get('callbackUrl')?.toString().trim() || undefined,
				}
			}
		} catch {
			// Not a form request or parsing failed
		}

		// Use resource-aware email templates when resource context is available
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
