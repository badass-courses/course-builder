import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

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

export const PostTypeSchema = z.union([
	z.literal('article'),
	z.literal('lesson'),
	z.literal('podcast'),
])

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			postType: PostTypeSchema.default('lesson'),
			summary: z.string().optional().nullable(),
			body: z.string().nullable().optional(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('unlisted'),
			eggheadLessonId: z.coerce.number().nullish(),
			slug: z.string(),
			description: z.string().nullish(),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		tags: z.array(z.any()),
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
		visibility: PostVisibilitySchema.optional().default('unlisted'),
	}),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>
