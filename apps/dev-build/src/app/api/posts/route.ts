import { NextRequest, NextResponse } from 'next/server'
import {
	createPost,
	deletePost,
	getPostById,
	getPosts,
	PostError,
	updatePost,
} from '@/lib/posts/posts.service'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		await log.info('api.posts.get.started', {
			userId: user?.id,
			slugOrId,
			hasAbility: !!ability,
		})

		const result = await getPosts({ userId: user?.id, ability, slug: slugOrId })

		await log.info('api.posts.get.success', {
			userId: user?.id,
			slugOrId,
			resultCount: Array.isArray(result) ? result.length : 1,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			await log.error('api.posts.get.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				slugOrId,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.posts.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			slugOrId,
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
			await log.warn('api.posts.post.unauthorized', {
				headers: Object.fromEntries(request.headers),
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		const body = await request.json()
		await log.info('api.posts.post.started', {
			userId: user.id,
			title: body.title,
		})

		const result = await createPost({ data: body, userId: user.id, ability })

		await log.info('api.posts.post.success', {
			userId: user.id,
			postId: result.id,
			title: result.fields?.title,
		})

		return NextResponse.json(result, { status: 201, headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			await log.error('api.posts.post.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.posts.post.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function PUT(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const action = searchParams.get('action')
	const id = searchParams.get('id')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			await log.warn('api.posts.put.unauthorized', {
				headers: Object.fromEntries(request.headers),
				postId: id,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!id) {
			await log.warn('api.posts.put.invalid', {
				userId: user.id,
				error: 'Missing post ID',
			})
			return NextResponse.json(
				{ error: 'Missing post ID' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const body = await request.json()
		await log.info('api.posts.put.started', {
			userId: user.id,
			postId: id,
			action,
			changes: Object.keys(body),
		})

		const result = await updatePost({
			id,
			data: body,
			action,
			userId: user.id,
			ability,
		})

		await log.info('api.posts.put.success', {
			userId: user.id,
			postId: id,
			action,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			await log.error('api.posts.put.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				postId: id,
				action,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.posts.put.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			postId: id,
			action,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function DELETE(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		await log.info('api.posts.delete.started', {
			userId: user?.id,
			postId: id,
		})

		const result = await deletePost({ id: id || '', ability })

		await log.info('api.posts.delete.success', {
			userId: user?.id,
			postId: id,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			await log.error('api.posts.delete.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				postId: id,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.posts.delete.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			postId: id,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
