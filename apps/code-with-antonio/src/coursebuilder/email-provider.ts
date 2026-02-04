import { cookies } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import Postmark from 'next-auth/providers/postmark'

import { sendVerificationRequest } from '@coursebuilder/core/lib/send-verification-request'

export const emailProvider = Postmark({
	apiKey: env.POSTMARK_API_KEY,
	from: env.NEXT_PUBLIC_SUPPORT_EMAIL,
	sendVerificationRequest: async (params) => {
		let name: string | undefined
		try {
			const formData = await params.request.clone().formData()
			// NextAuth transforms form into JSON - first key contains all data
			const firstKey = [...formData.keys()][0]
			if (firstKey?.startsWith('{')) {
				const parsed = JSON.parse(firstKey)
				name = parsed.firstName?.trim() || undefined
			} else {
				// Standard form data
				name = formData.get('firstName')?.toString().trim() || undefined
			}
		} catch {
			// Not a form request or parsing failed
		}

		const result = await sendVerificationRequest(
			{ ...params, name },
			courseBuilderAdapter,
		)

		// Track shortlink attribution for signups
		try {
			const cookieStore = await cookies()
			const shortlinkSlug = cookieStore.get('sl_ref')?.value
			if (shortlinkSlug && params.identifier) {
				// Dynamic import to avoid circular dependency
				// (shortlinks-query → auth → email-provider)
				import('@/lib/shortlinks-query')
					.then(({ createShortlinkAttribution }) =>
						createShortlinkAttribution({
							shortlinkSlug,
							email: params.identifier,
							type: 'signup',
						}),
					)
					.catch((error) => {
						console.error('Failed to record shortlink attribution:', error)
					})
			}
		} catch (error) {
			console.error('Error tracking shortlink attribution:', error)
		}

		return result
	},
})
