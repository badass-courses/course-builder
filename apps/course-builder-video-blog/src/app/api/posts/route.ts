import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter, db } from '@/db'
import {
	deletePostFromDatabase,
	NewPostSchema,
	PostUpdateSchema,
	writeNewPostToDatabase,
	writePostUpdateToDatabase,
} from '@/lib/posts'
import { getAllPosts, getPost } from '@/lib/posts-server-functions'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { subject } from '@casl/ability'

export async function GET(request: NextRequest) {
	const { ability } = await getUserAbilityForRequest(request)
	const { searchParams } = new URL(request.url)
	const slug = searchParams.get('slug')

	console.log('GET THAT POST', { slug })

	if (slug) {
		const post = await getPost(slug)
		console.log('post....')
		console.dir(post, { depth: null })
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 })
		}
		if (ability.can('read', subject('Content', post))) {
			return NextResponse.json(post)
		}
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (ability.cannot('read', 'Content')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const posts = await getAllPosts()
	return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
	const { ability } = await getUserAbilityForRequest(request)

	if (ability.cannot('create', 'Content')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json()
	const validatedData = NewPostSchema.safeParse(body)

	if (!validatedData.success) {
		return NextResponse.json({ error: validatedData.error }, { status: 400 })
	}

	try {
		const newPost = await writeNewPostToDatabase(validatedData.data)
		return NextResponse.json(newPost, { status: 201 })
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to create post' },
			{ status: 500 },
		)
	}
}

export async function PUT(request: NextRequest) {
	const body = await request.json()

	const { ability } = await getUserAbilityForRequest(request)

	const validatedData = PostUpdateSchema.safeParse(body)

	if (!validatedData.success) {
		return NextResponse.json({ error: validatedData.error }, { status: 400 })
	}

	const originalPost = await courseBuilderAdapter.getContentResource(
		validatedData.data.id,
	)

	if (!originalPost) {
		return NextResponse.json({ error: 'Post not found' }, { status: 404 })
	}

	if (ability.cannot('manage', subject('Content', originalPost))) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const updatedPost = await writePostUpdateToDatabase(validatedData.data)
		return NextResponse.json(updatedPost)
	} catch (error) {
		console.error('Failed to update post', error)
		return NextResponse.json(
			{ error: 'Failed to update post' },
			{ status: 500 },
		)
	}
}

export async function DELETE(request: NextRequest) {
	const { ability } = await getUserAbilityForRequest(request)
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	if (!id) {
		return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
	}
	const postToDelete = await courseBuilderAdapter.getContentResource(id)

	if (!postToDelete) {
		return NextResponse.json({ error: 'Post not found' }, { status: 404 })
	}

	if (ability.cannot('delete', subject('Content', postToDelete))) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		await deletePostFromDatabase(id)
		return NextResponse.json({ message: 'Post deleted successfully' })
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to delete post' },
			{ status: 500 },
		)
	}
}
