import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { POST as courseBuilderPOST } from '@/coursebuilder/course-builder-config'
import { createShortlinkAttribution } from '@/lib/shortlink-attribution'
import { redis } from '@/server/redis-client'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * Custom wrapper for the subscribe-to-list endpoint that adds shortlink attribution tracking
 *
 * This route intercepts newsletter signups and records attribution if the user
 * came from a shortlink (identified by the sl_ref cookie)
 */
export async function POST(req: NextRequest) {
	// Rate limit: 5 subscribe attempts per hour per IP
	const ip = req.headers.get('x-forwarded-for') || 'unknown'
	const ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(5, '1 h'),
	})
	const { success: withinLimit } = await ratelimit.limit(`subscribe_${ip}`)
	if (!withinLimit) {
		return NextResponse.json(
			{ error: 'Too many attempts. Please try again later.' },
			{ status: 429 },
		)
	}

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
				}).catch((error: unknown) => {
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
