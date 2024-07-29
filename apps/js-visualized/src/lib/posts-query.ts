'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contributionTypes,
} from '@/db/schema'
import { NewPost, Post, PostSchema, PostUpdate } from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { asc, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

export async function deletePost(id: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}

	const post = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, id),
		with: {
			resources: true,
		},
	})

	if (!post) {
		throw new Error(`Post with id ${id} not found.`)
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

export async function getPost(slug: string): Promise<Post | null> {
	console.log({ slug })
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

	const newPostId = `post_${guid()}`

	const videoResource = await courseBuilderAdapter.getVideoResource(
		input.videoResourceId,
	)

	if (!videoResource) {
		throw new Error('🚨 Video Resource not found')
	}

	const resource = await db
		.insert(contentResource)
		.values({
			id: newPostId,
			type: 'post',
			createdById: user.id,
			fields: {
				title: input.title,
				state: 'draft',
				visibility: 'unlisted',
				slug: slugify(`${input.title}~${guid()}`),
			},
		})
		.catch((error) => {
			console.error('🚨 Error creating post', error)
			throw error
		})

	const post = await getPost(newPostId)

	if (post) {
		await db
			.insert(contentResourceResource)
			.values({ resourceOfId: post.id, resourceId: input.videoResourceId })

		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${guid()}`,
				userId: user.id,
				contentId: post.id,
				contributionTypeId: contributionType.id,
			})
		}

		revalidateTag('posts')

		return post
	} else {
		throw new Error('🚨 Error creating post: Post not found')
	}
}

export async function updatePost(input: PostUpdate) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentPost = await getPost(input.id)

	if (!currentPost) {
		throw new Error(`Post with id ${input.id} not found.`)
	}

	let postSlug = currentPost.fields.slug

	if (input.fields.title !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		postSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentPost.id,
		fields: {
			...currentPost.fields,
			...input.fields,
			slug: postSlug,
		},
	})
}
