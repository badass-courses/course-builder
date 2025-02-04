import { NextRequest, NextResponse } from 'next/server'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'

const URL_PREFIX = 'https://github.com/ai-hero-dev/ai-hero/tree/main/'

interface ShortlinkPayload {
	key: string
	url: string
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const key = searchParams.get('key')

	try {
		const { user } = await getUserAbilityForRequest(request)
		await log.info('api.shortlinks.get.started', {
			key,
			userId: user?.id,
		})

		if (!key) {
			return NextResponse.json(
				{ error: 'Key is required.' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const url = await redis.get(`shortlink:${key}`)
		const fullUrl = `${URL_PREFIX}${url}`

		if (!url) {
			return NextResponse.json(
				{ error: 'Shortlink not found.' },
				{ status: 404, headers: corsHeaders },
			)
		}

		await log.info('api.shortlinks.get.success', {
			key,
			redirectTo: fullUrl,
		})
		return NextResponse.redirect(fullUrl, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.shortlinks.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			key,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			await log.warn('api.shortlinks.post.unauthorized', {
				headers: Object.fromEntries(request.headers),
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		// Check if user has ability to create content
		if (!ability.can('create', 'Content')) {
			await log.warn('api.shortlinks.post.forbidden', {
				userId: user.id,
			})
			return NextResponse.json(
				{ error: 'Forbidden: Insufficient permissions' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const body: ShortlinkPayload = await request.json()
		await log.info('api.shortlinks.post.started', {
			key: body.key,
			userId: user.id,
		})

		if (!body.key || !body.url) {
			return NextResponse.json(
				{ error: 'Key and URL are required.' },
				{ status: 400, headers: corsHeaders },
			)
		}

		await redis.set(`shortlink:${body.key}`, body.url)

		await log.info('api.shortlinks.post.success', {
			key: body.key,
		})

		return NextResponse.json(
			{ message: 'Shortlink created/updated successfully.' },
			{ headers: corsHeaders },
		)
	} catch (error) {
		await log.error('api.shortlinks.post.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			await log.warn('api.shortlinks.delete.unauthorized', {
				headers: Object.fromEntries(request.headers),
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		// Check if user has ability to delete content
		if (!ability.can('delete', 'Content')) {
			await log.warn('api.shortlinks.delete.forbidden', {
				userId: user.id,
			})
			return NextResponse.json(
				{ error: 'Forbidden: Insufficient permissions' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const { searchParams } = new URL(request.url)
		const key = searchParams.get('key')

		await log.info('api.shortlinks.delete.started', {
			key,
			userId: user.id,
		})

		if (!key) {
			return NextResponse.json(
				{ error: 'Key is required.' },
				{ status: 400, headers: corsHeaders },
			)
		}

		await redis.del(`shortlink:${key}`)

		await log.info('api.shortlinks.delete.success', { key })
		return NextResponse.json(
			{ message: 'Shortlink deleted successfully.' },
			{ headers: corsHeaders },
		)
	} catch (error) {
		await log.error('api.shortlinks.delete.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
