import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter } from '@/db'
import { getEggheadUserProfile } from '@/lib/egghead'
import { NewPostSchema, PostActionSchema, PostUpdateSchema } from '@/lib/posts'
import {
	deletePostFromDatabase,
	getAllPostsForUser,
	getPost,
	writeNewPostToDatabase,
	writePostUpdateToDatabase,
} from '@/lib/posts-query'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { subject } from '@casl/ability'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { ability, user } = await getUserAbilityForRequest(request)
	const { searchParams } = new URL(request.url)
	const slug = searchParams.get('slug')

	if (slug) {
		const post = await getPost(slug)
		if (!post) {
			return NextResponse.json(
				{ error: 'Post not found' },
				{ status: 404, headers: corsHeaders },
			)
		}
		if (ability.can('read', subject('Content', post))) {
			return NextResponse.json(post, { headers: corsHeaders })
		}
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	if (ability.cannot('read', 'Content')) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	const posts = await getAllPostsForUser(user?.id)
	return NextResponse.json(posts, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
	const { ability, user } = await getUserAbilityForRequest(request)

	if (ability.cannot('create', 'Content')) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	if (!user) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	const body = await request.json()
	const validatedData = NewPostSchema.safeParse(body)

	if (!validatedData.success) {
		return NextResponse.json(
			{ error: validatedData.error },
			{ status: 400, headers: corsHeaders },
		)
	}

	const profile = await getEggheadUserProfile(user.id)

	if (!profile.instructor.id) {
		return NextResponse.json(
			{ error: 'Unauthorized: egghead instructor profile not found' },
			{ status: 401, headers: corsHeaders },
		)
	}

	try {
		const newPost = await writeNewPostToDatabase({
			newPost: validatedData.data,
			eggheadInstructorId: profile.instructor.id,
			createdById: user.id,
		})
		return NextResponse.json(newPost, { status: 201, headers: corsHeaders })
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to create post' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function PUT(request: NextRequest) {
	const body = await request.json()
	const { searchParams } = new URL(request.url)
	const actionInput = PostActionSchema.safeParse(
		searchParams.get('action') || 'save',
	)

	if (!actionInput.success) {
		return NextResponse.json(
			{ error: 'Invalid action' },
			{ status: 400, headers: corsHeaders },
		)
	}

	const action = actionInput.data

	const { ability, user } = await getUserAbilityForRequest(request)

	if (!user) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	const validatedData = PostUpdateSchema.safeParse(body)

	if (!validatedData.success) {
		return NextResponse.json(
			{ error: validatedData.error },
			{ status: 400, headers: corsHeaders },
		)
	}

	const originalPost = await getPost(validatedData.data.id)

	if (!originalPost) {
		return NextResponse.json(
			{ error: 'Post not found' },
			{ status: 404, headers: corsHeaders },
		)
	}

	if (ability.cannot('manage', subject('Content', originalPost))) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	try {
		const updatedPost = await writePostUpdateToDatabase({
			currentPost: originalPost,
			postUpdate: validatedData.data,
			action,
			updatedById: user.id,
		})
		return NextResponse.json(updatedPost, { headers: corsHeaders })
	} catch (error) {
		console.error('Failed to update post', error)
		return NextResponse.json(
			{ error: 'Failed to update post' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function DELETE(request: NextRequest) {
	const { ability } = await getUserAbilityForRequest(request)
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	if (!id) {
		return NextResponse.json(
			{ error: 'Missing post ID' },
			{ status: 400, headers: corsHeaders },
		)
	}
	const postToDelete = await courseBuilderAdapter.getContentResource(id)

	if (!postToDelete) {
		return NextResponse.json(
			{ error: 'Post not found' },
			{ status: 404, headers: corsHeaders },
		)
	}

	if (ability.cannot('delete', subject('Content', postToDelete))) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	try {
		await deletePostFromDatabase(id)
		return NextResponse.json(
			{ message: 'Post deleted successfully' },
			{ headers: corsHeaders },
		)
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to delete post' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
