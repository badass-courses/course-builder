import { courseBuilderAdapter, db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contributionTypes,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { slugify } from 'inngest'
import { z } from 'zod'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import { getPost } from './posts-server-functions'

export const PostStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const PostVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			summary: z.string().optional().nullable(),
			body: z.string().default(''),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('unlisted'),
			slug: z.string(),
		}),
	}),
)

export type Post = z.infer<typeof PostSchema>

export const NewPostSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video').optional(),
})

export type NewPost = z.infer<typeof NewPostSchema>

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string(),
	}),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>

export async function writePostUpdateToDatabase(input: PostUpdate) {
	const currentPost = await getPost(input.id)

	if (!currentPost) {
		throw new Error(`Post with id ${input.id} not found.`)
	}

	if (!input.fields.title) {
		throw new Error('Title is required')
	}

	let postSlug = currentPost.fields.slug

	if (input.fields.title !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		postSlug = `${slugify(input.fields.title ?? '')}~${splitSlug[1] || guid()}`
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

export async function writeNewPostToDatabase(input: NewPost) {
	const newPostId = `post_${guid()}`
	const videoResource = await courseBuilderAdapter.getVideoResource(
		input.videoResourceId,
	)

	await db
		.insert(contentResource)
		.values({
			id: newPostId,
			type: 'post',
			createdById: '8ee01d65-144c-4977-9468-420e78dc8cd7', //user.id,
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
		if (videoResource) {
			await db
				.insert(contentResourceResource)
				.values({ resourceOfId: post.id, resourceId: videoResource.id })
		}

		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${guid()}`,
				userId: '8ee01d65-144c-4977-9468-420e78dc8cd7', //user.id,
				contentId: post.id,
				contributionTypeId: contributionType.id,
			})
		}

		return post
	}
	return null
}

export async function deletePostFromDatabase(id: string) {
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

	return true
}
