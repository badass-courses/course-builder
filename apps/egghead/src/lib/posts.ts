import crypto from 'crypto'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export const PostActionSchema = z.union([
	z.literal('publish'),
	z.literal('unpublish'),
	z.literal('archive'),
	z.literal('save'),
])

export type PostAction = z.infer<typeof PostActionSchema>

export const PostStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export type PostState = z.infer<typeof PostStateSchema>

export const PostVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export type PostVisibility = z.infer<typeof PostVisibilitySchema>

export const PostTypeSchema = z.union([
	z.literal('article'),
	z.literal('lesson'),
	z.literal('podcast'),
	z.literal('tip'),
	z.literal('course'),
])

export type PostType = z.infer<typeof PostTypeSchema>

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			postType: PostTypeSchema.default('lesson'),
			summary: z.string().optional().nullable(),
			body: z.string().nullable().optional(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('public'),
			eggheadLessonId: z.coerce.number().nullish(),
			slug: z.string(),
			description: z.string().nullish(),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		tags: z.array(z.any()).nullish(),
		currentVersionId: z.string().nullish(),
	}),
)

export type Post = z.infer<typeof PostSchema>

export const NewPostSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video').nullish(),
})

export type NewPost = z.infer<typeof NewPostSchema>

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		postType: PostTypeSchema.optional().default('lesson'),
		body: z.string().optional().nullable(),
		visibility: PostVisibilitySchema.optional().default('public'),
		state: PostStateSchema.optional().default('draft'),
	}),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>

export function updatePostSlug(currentPost: Post, newTitle: string): string {
	if (newTitle !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		return `${slugify(newTitle)}~${splitSlug[1] || guid()}`
	}
	return currentPost.fields.slug
}

export function generateContentHash(post: Post): string {
	const content = JSON.stringify({
		title: post.fields.title,
		body: post.fields.body,
		description: post.fields.description,
		slug: post.fields.slug,
		// Add any other fields that should be considered for content changes
	})
	return crypto.createHash('sha256').update(content).digest('hex')
}
