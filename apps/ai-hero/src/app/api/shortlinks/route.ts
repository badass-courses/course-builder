import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env.mjs'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'

interface ShortlinkPayload {
	key: string
	url: string
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const validateBearerToken = (request: NextRequest): boolean => {
	const authHeader = request.headers.get('authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return false
	}

	const token = authHeader.split(' ')[1]
	const validToken = env.SHORTLINKS_BEARER_TOKEN

	if (!validToken) {
		log.error('api.shortlinks.auth.configuration_error', {
			error: 'SHORTLINKS_BEARER_TOKEN environment variable is not set',
		})
		return false
	}

	return token === validToken
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	if (!validateBearerToken(request)) {
		await log.warn('api.shortlinks.get.unauthorized', {
			headers: Object.fromEntries(request.headers),
		})
		return NextResponse.json(
			{ error: 'Unauthorized: Invalid or missing Bearer token.' },
			{ status: 401, headers: corsHeaders },
		)
	}

	const { searchParams } = new URL(request.url)
	const key = searchParams.get('key')

	try {
		await log.info('api.shortlinks.get.started', { key })

		if (!key) {
			return NextResponse.json(
				{ error: 'Key is required.' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const url = await redis.get(`shortlink:${key}`)
		if (!url) {
			return NextResponse.json(
				{ error: 'Shortlink not found.' },
				{ status: 404, headers: corsHeaders },
			)
		}

		await log.info('api.shortlinks.get.success', { key })
		return NextResponse.json({ key, url }, { headers: corsHeaders })
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
	if (!validateBearerToken(request)) {
		await log.warn('api.shortlinks.post.unauthorized', {
			headers: Object.fromEntries(request.headers),
		})
		return NextResponse.json(
			{ error: 'Unauthorized: Invalid or missing Bearer token.' },
			{ status: 401, headers: corsHeaders },
		)
	}

	try {
		const body: ShortlinkPayload = await request.json()
		await log.info('api.shortlinks.post.started', {
			key: body.key,
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
	if (!validateBearerToken(request)) {
		await log.warn('api.shortlinks.delete.unauthorized', {
			headers: Object.fromEntries(request.headers),
		})
		return NextResponse.json(
			{ error: 'Unauthorized: Invalid or missing Bearer token.' },
			{ status: 401, headers: corsHeaders },
		)
	}

	const { searchParams } = new URL(request.url)
	const key = searchParams.get('key')

	try {
		await log.info('api.shortlinks.delete.started', { key })

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
			key,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
