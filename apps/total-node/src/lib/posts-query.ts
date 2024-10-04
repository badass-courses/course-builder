'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { NewPost, Post, PostSchema, type PostUpdate } from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export const getCachedAllPosts = unstable_cache(
	async () => getAllPosts(),
	['posts'],
	{ revalidate: 3600 },
)

export async function getAllPosts(): Promise<Post[]> {
	const posts = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'post'),
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

export async function getPosts(): Promise<Post[]> {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const posts = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
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

	const postGuid = guid()
	const newPostId = `post_${postGuid}`

	const postValues = {
		id: newPostId,
		type: 'post',
		createdById: user.id,
		fields: {
			title: input.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.title}~${postGuid}`),
		},
	}
	await db
		.insert(contentResource)
		.values(postValues)
		.catch((error) => {
			console.error('🚨 Error creating post', error)
			throw error
		})

	const post = await getPost(newPostId)
	if (post) {
		if (input?.videoResourceId) {
			await db
				.insert(contentResourceResource)
				.values({ resourceOfId: post.id, resourceId: input.videoResourceId })
		}

		revalidateTag('posts')

		return post
	} else {
		throw new Error('🚨 Error creating post: Post not found')
	}
}

export async function updatePost(
	input: PostUpdate,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const currentPost = await getPost(input.id)

	if (!currentPost) {
		throw new Error(`Post with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentPost))) {
		throw new Error('Unauthorized')
	}

	let postSlug = currentPost.fields.slug

	if (input.fields.title !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		postSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	revalidateTag('posts')

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentPost.id,
		fields: {
			...currentPost.fields,
			...input.fields,
			slug: postSlug,
		},
	})
}

export const getCachedPost = unstable_cache(
	async (slug: string) => getPost(slug),
	['posts'],
	{ revalidate: 3600 },
)

export async function getPost(slugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const post = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
			eq(contentResource.type, 'post'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
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
		console.debug('Error parsing post', postParsed)
		return null
	}

	return postParsed.data
}

export async function deletePost(id: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const post = PostSchema.nullish().parse(
		await db.query.contentResource.findFirst({
			where: eq(contentResource.id, id),
			with: {
				resources: true,
			},
		}),
	)

	if (!post) {
		throw new Error(`Post with id ${id} not found.`)
	}

	if (!user || !ability.can('delete', subject('Content', post))) {
		throw new Error('Unauthorized')
	}

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	revalidateTag('posts')
	revalidateTag(id)
	revalidatePath('/posts')

	return true
}
