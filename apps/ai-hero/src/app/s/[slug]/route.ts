import { NextRequest, NextResponse } from 'next/server'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'
import { getShortlinkUrl } from '@/server/shortlinks'

/**
 * Route handler for shortlink redirects
 * Matches URLs like /s/[slug] and redirects to the corresponding URL
 * @returns NextResponse with either a redirect or appropriate error status
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { slug: string } },
) {
	try {
		const { user } = await getUserAbilityForRequest(request)
		const url = await getShortlinkUrl(params.slug, user?.id)

		if (!url) {
			return new NextResponse('Shortlink not found', { status: 404 })
		}

		return NextResponse.redirect(url)
	} catch (error) {
		await log.error('shortlink.redirect.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			key: params.slug,
		})
		return new NextResponse('Internal Server Error', { status: 500 })
	}
}
