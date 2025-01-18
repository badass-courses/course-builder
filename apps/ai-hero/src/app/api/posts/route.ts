import { NextRequest, NextResponse } from 'next/server'
import {
	createPost,
	deletePost,
	getPosts,
	PostError,
	updatePost,
} from '@/lib/posts/posts.service'
import { getUserAbilityForRequest } from '@/server/ability-for-request'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		const { searchParams } = new URL(request.url)
		const slug = searchParams.get('slug')

		const result = await getPosts({ userId: user?.id, ability, slug })
		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
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
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		const body = await request.json()
		const result = await createPost({ data: body, userId: user.id, ability })
		return NextResponse.json(result, { status: 201, headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		const body = await request.json()
		const { searchParams } = new URL(request.url)
		const action = searchParams.get('action')
		const id = searchParams.get('id')

		if (!id) {
			return NextResponse.json(
				{ error: 'Missing post ID' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const result = await updatePost({
			id,
			data: body,
			action,
			userId: user.id,
			ability,
		})
		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { ability } = await getUserAbilityForRequest(request)
		const { searchParams } = new URL(request.url)
		const id = searchParams.get('id')

		const result = await deletePost({ id: id || '', ability })
		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof PostError) {
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
