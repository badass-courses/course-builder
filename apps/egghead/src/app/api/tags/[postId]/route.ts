import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePostTags } from '@/lib/posts-query'
import { EggheadTagSchema } from '@/lib/tags'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { subject } from '@casl/ability'
import { z } from 'zod'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(
	request: NextRequest,
	props: { params: Promise<{ postId: string }> },
) {
	const params = await props.params
	const { ability } = await getUserAbilityForRequest(request)

	if (!params.postId) {
		return NextResponse.json(
			{ error: 'postId is required' },
			{ status: 400, headers: corsHeaders },
		)
	}

	const post = await getPost(params.postId)

	if (!post) {
		return NextResponse.json(
			{ error: 'Post not found' },
			{ status: 404, headers: corsHeaders },
		)
	}

	if (ability.cannot('manage', subject('Content', post))) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	const body = await request.json()

	const validatedData = z.array(EggheadTagSchema).safeParse(body)

	if (!validatedData.success) {
		return NextResponse.json(
			{ error: 'Invalid request body', details: validatedData.error },
			{ status: 400, headers: corsHeaders },
		)
	}

	try {
		await updatePostTags(params.postId, validatedData.data)
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to update post tags' },
			{ status: 500, headers: corsHeaders },
		)
	}

	return NextResponse.json({}, { headers: corsHeaders })
}
