import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { POST as courseBuilderPOST } from '@/coursebuilder/course-builder-config'
import { createShortlinkAttribution } from '@/lib/shortlinks-query'

/**
 * Custom wrapper for the subscribe-to-list endpoint that adds shortlink attribution tracking
 *
 * This route intercepts newsletter signups and records attribution if the user
 * came from a shortlink (identified by the sl_ref cookie)
 */
export async function POST(req: NextRequest) {
	// Read the request body before passing to coursebuilder
	const body = await req.json()
	const email = body.email

	// Clone the request with the body since it can only be read once
	const clonedRequest = new NextRequest(req.url, {
		method: 'POST',
		headers: req.headers,
		body: JSON.stringify(body),
	})

	// Get the original response from coursebuilder
	const response = await courseBuilderPOST(clonedRequest)

	// Only track attribution on successful subscriptions (status 200)
	if (response.status === 200 && email) {
		try {
			// Read the sl_ref cookie to get the shortlink slug
			const cookieStore = await cookies()
			const shortlinkSlug = cookieStore.get('sl_ref')?.value

			if (shortlinkSlug) {
				// Record attribution asynchronously (don't await to avoid slowing down response)
				createShortlinkAttribution({
					shortlinkSlug,
					email,
					type: 'signup',
				}).catch((error) => {
					console.error('Failed to record shortlink attribution:', error)
				})
			}
		} catch (error) {
			// Log error but don't fail the subscription
			console.error('Error tracking shortlink attribution:', error)
		}
	}

	return response
}
