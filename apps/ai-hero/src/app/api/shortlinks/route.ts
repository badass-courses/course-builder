import { NextRequest, NextResponse } from 'next/server'
import {
	createShortlink,
	deleteShortlink,
	getShortlinkById,
	getShortlinks,
	updateShortlink,
} from '@/lib/shortlinks-query'
import {
	CreateShortlinkSchema,
	UpdateShortlinkSchema,
} from '@/lib/shortlinks-types'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/shortlinks - List all shortlinks (admin) or get single by ID
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')
	const search = searchParams.get('search')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!ability.can('manage', 'all')) {
			return NextResponse.json(
				{ error: 'Forbidden: Admin access required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		if (id) {
			// Get single shortlink
			const link = await getShortlinkById(id)
			if (!link) {
				return NextResponse.json(
					{ error: 'Shortlink not found' },
					{ status: 404, headers: corsHeaders },
				)
			}
			return NextResponse.json(link, { headers: corsHeaders })
		}

		// List all shortlinks
		const links = await getShortlinks(search ?? undefined)
		return NextResponse.json(links, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.shortlinks.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

/**
 * POST /api/shortlinks - Create a new shortlink
 */
export async function POST(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user) {
			await log.warn('api.shortlinks.post.unauthorized', {})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!ability.can('create', 'Content')) {
			await log.warn('api.shortlinks.post.forbidden', { userId: user.id })
			return NextResponse.json(
				{ error: 'Forbidden: Insufficient permissions' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const body = await request.json()
		const parsed = CreateShortlinkSchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: parsed.error.format() },
				{ status: 400, headers: corsHeaders },
			)
		}

		await log.info('api.shortlinks.post.started', {
			slug: parsed.data.slug,
			userId: user.id,
		})

		const link = await createShortlink(parsed.data)

		await log.info('api.shortlinks.post.success', {
			id: link.id,
			slug: link.slug,
		})

		return NextResponse.json(link, { status: 201, headers: corsHeaders })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'

		if (message === 'Slug already exists') {
			return NextResponse.json(
				{ error: 'Slug already exists' },
				{ status: 409, headers: corsHeaders },
			)
		}

		await log.error('api.shortlinks.post.failed', {
			error: message,
			stack: error instanceof Error ? error.stack : undefined,
		})

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

/**
 * PATCH /api/shortlinks - Update an existing shortlink
 */
export async function PATCH(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!ability.can('update', 'Content')) {
			await log.warn('api.shortlinks.patch.forbidden', { userId: user.id })
			return NextResponse.json(
				{ error: 'Forbidden: Insufficient permissions' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const body = await request.json()
		const parsed = UpdateShortlinkSchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: 'Invalid input', details: parsed.error.format() },
				{ status: 400, headers: corsHeaders },
			)
		}

		await log.info('api.shortlinks.patch.started', {
			id: parsed.data.id,
			userId: user.id,
		})

		const link = await updateShortlink(parsed.data)

		await log.info('api.shortlinks.patch.success', {
			id: link.id,
			slug: link.slug,
		})

		return NextResponse.json(link, { headers: corsHeaders })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'

		if (message === 'Shortlink not found') {
			return NextResponse.json(
				{ error: 'Shortlink not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		if (message === 'Slug already exists') {
			return NextResponse.json(
				{ error: 'Slug already exists' },
				{ status: 409, headers: corsHeaders },
			)
		}

		await log.error('api.shortlinks.patch.failed', {
			error: message,
			stack: error instanceof Error ? error.stack : undefined,
		})

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

/**
 * DELETE /api/shortlinks - Delete a shortlink by ID
 */
export async function DELETE(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!ability.can('delete', 'Content')) {
			await log.warn('api.shortlinks.delete.forbidden', { userId: user.id })
			return NextResponse.json(
				{ error: 'Forbidden: Insufficient permissions' },
				{ status: 403, headers: corsHeaders },
			)
		}

		if (!id) {
			return NextResponse.json(
				{ error: 'ID is required' },
				{ status: 400, headers: corsHeaders },
			)
		}

		await log.info('api.shortlinks.delete.started', { id, userId: user.id })

		await deleteShortlink(id)

		await log.info('api.shortlinks.delete.success', { id })

		return NextResponse.json(
			{ message: 'Shortlink deleted successfully' },
			{ headers: corsHeaders },
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'

		if (message === 'Shortlink not found') {
			return NextResponse.json(
				{ error: 'Shortlink not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		await log.error('api.shortlinks.delete.failed', {
			error: message,
			stack: error instanceof Error ? error.stack : undefined,
		})

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
