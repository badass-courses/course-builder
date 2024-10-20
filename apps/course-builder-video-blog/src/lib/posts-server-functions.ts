'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import {
	deletePostFromDatabase,
	NewPost,
	Post,
	PostSchema,
	PostUpdate,
	writeNewPostToDatabase,
	writePostUpdateToDatabase,
} from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { asc, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import 'server-only'

export async function deletePost(id: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}

	await deletePostFromDatabase(id)

	revalidateTag('posts')
	revalidateTag(id)
	revalidatePath('/posts')

	return true
}

export async function getPost(slug: string): Promise<Post | null> {
	const post = await db.query.contentResource.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slug),
			eq(contentResource.id, slug),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const postParsed = PostSchema.safeParse(post)
	if (!postParsed.success) {
		console.error('Error parsing post', postParsed)
		return null
	}

	return postParsed.data
}

export async function getAllPosts(): Promise<Post[]> {
	const posts = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'post'),
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed)
		return []
	}

	return postsParsed.data
}

export async function createPost(input: NewPost) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const post = writeNewPostToDatabase(input)
	if (post) {
		revalidatePath('/posts')
		revalidateTag('posts')
		return post
	}
	return null
}

export async function updatePost(input: PostUpdate) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const updatedPost = await writePostUpdateToDatabase(input)

	revalidatePath('/posts')

	return updatedPost
}
