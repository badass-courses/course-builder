import { NextRequest, NextResponse } from 'next/server'
import { getShortlinkBySlug, recordClick } from '@/lib/shortlinks-query'
import { log } from '@/server/logger'

/**
 * Parse device type from user-agent string
 */
function parseDevice(userAgent: string | null): string | null {
	if (!userAgent) return null

	const ua = userAgent.toLowerCase()
	if (ua.includes('mobile') || ua.includes('android')) return 'mobile'
	if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet'
	return 'desktop'
}

/**
 * Route handler for shortlink redirects
 * Matches URLs like /s/[slug] and redirects to the corresponding URL
 * Records click analytics asynchronously
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
	const { slug } = await params

	try {
		const link = await getShortlinkBySlug(slug)

		if (!link) {
			return new NextResponse('Shortlink not found', { status: 404 })
		}

		// Extract analytics metadata from request headers
		const referrer = request.headers.get('referer')
		const userAgent = request.headers.get('user-agent')
		const country = request.headers.get('x-vercel-ip-country')
		const device = parseDevice(userAgent)

		// Record click asynchronously - don't wait for it
		recordClick(slug, {
			referrer,
			userAgent,
			country,
			device,
		}).catch((error) => {
			log.error('shortlink.click.record.failed', {
				slug,
				error: String(error),
			})
		})

		// Set attribution cookie and redirect
		const response = NextResponse.redirect(link.url)
		response.cookies.set('sl_ref', slug, {
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: '/',
			httpOnly: false, // Allow JS access for form submission
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		})

		return response
	} catch (error) {
		await log.error('shortlink.redirect.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			slug,
		})
		return new NextResponse('Internal Server Error', { status: 500 })
	}
}
