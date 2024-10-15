import { NextRequest, NextResponse } from 'next/server'
import { getAbility, UserSchema } from '@/ability'
import { db } from '@/db'
import { deviceAccessToken } from '@/db/schema'
import { NewPostSchema, PostUpdateSchema } from '@/lib/posts'
import {
	createPost,
	deletePost,
	getAllPosts,
	getPost,
	updatePost,
} from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'
import { eq } from 'drizzle-orm'

async function getUserAbilityForRequest(request: NextRequest) {
	const authToken = request.headers.get('Authorization')?.split(' ')[1]

	console.log('authToken', authToken)

	if (!authToken) {
		return { user: null, ability: null }
	}

	const deviceToken = await db.query.deviceAccessToken.findFirst({
		where: eq(deviceAccessToken.token, authToken),
		with: {
			verifiedBy: {
				with: {
					roles: {
						with: {
							role: true,
						},
					},
				},
			},
		},
	})

	if (!deviceToken) {
		return { user: null, ability: null }
	}

	const userParsed = UserSchema.safeParse({
		...deviceToken.verifiedBy,
		roles: deviceToken.verifiedBy.roles.map((role) => role.role),
	})

	if (!userParsed.success) {
		return { user: null, ability: null }
	}

	const ability = getAbility({ user: userParsed.data })

	if (!ability.can('create', 'Content')) {
		return { user: userParsed.data, ability }
	}

	return { user: userParsed.data, ability }
}

export async function GET(request: NextRequest) {
	const { user, ability } = await getUserAbilityForRequest(request)
	const { searchParams } = new URL(request.url)
	const slug = searchParams.get('slug')

	if (!ability.can('read', 'Content')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (slug) {
		const post = await getPost(slug)
		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 })
		}
		return NextResponse.json(post)
	}

	const posts = await getAllPosts()
	return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
	const { user, ability } = await getUserAbilityForRequest(request)

	if (!user || !ability.can('create', 'Content')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json()
	console.log('POST', { body })
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

	const { user, ability } = await getUserAbilityForRequest(request)

	const validatedData = PostUpdateSchema.safeParse(body)

	if (!validatedData.success) {
		return NextResponse.json({ error: validatedData.error }, { status: 400 })
	}

	const originalPost = await courseBuilderAdapter.getContentResource(
		validatedData.data.id,
	)

	if (!user || !ability.can('manage', subject('Content', originalPost))) {
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
	const { user, ability } = await getUserAbilityForRequest(request)
	if (!user || !ability.can('delete', 'Content')) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	if (!id) {
		return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
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
