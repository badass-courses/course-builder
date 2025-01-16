import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import { TagSchema } from './tags'

export const POST_TYPES_WITH_VIDEO = ['lesson', 'podcast', 'tip']

export const PostTypeSchema = z.union([
	z.literal('article'),
	z.literal('lesson'),
	z.literal('podcast'),
	z.literal('tip'),
	z.literal('course'),
])

export type PostType = z.infer<typeof PostTypeSchema>

export const PostActionSchema = z.union([
	z.literal('publish'),
	z.literal('unpublish'),
	z.literal('archive'),
	z.literal('save'),
])

export type PostAction = z.infer<typeof PostActionSchema>

export const NewPostSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video'),
	postType: z.enum(['lesson', 'podcast', 'tip']),
})
export type NewPost = z.infer<typeof NewPostSchema>

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

export const PostTagsSchema = z
	.array(
		z.object({
			contentResourceId: z.string(),
			organizationId: z.string().nullish(),
			tagId: z.string(),
			position: z.number(),
			createdAt: z
				.union([z.string(), z.date()])
				.transform((val) => new Date(val)),
			updatedAt: z
				.union([z.string(), z.date()])
				.transform((val) => new Date(val)),
			deletedAt: z.any(),
			tag: TagSchema,
		}),
	)
	.nullish()

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			body: z.string().nullable().optional(),
			yDoc: z.string().nullable().optional(),
			title: z.string(),
			summary: z.string().optional().nullable(),
			description: z.string().optional(),
			slug: z.string(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('unlisted'),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		tags: PostTagsSchema,
	}),
)

export type Post = z.infer<typeof PostSchema>

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
		slug: z.string(),
		description: z.string().nullish(),
		state: PostStateSchema.default('draft'),
		visibility: PostVisibilitySchema.default('unlisted'),
		github: z.string().nullish(),
	}),
	tags: PostTagsSchema,
	videoResourceId: z.string().optional().nullable(),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>

export const NewPostInputSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	videoResourceId: z.string().optional(),
	postType: z.enum([
		'lesson',
		'podcast',
		'tip',
		'course',
		'playlist',
		'article',
	]),
	createdById: z.string(),
})

export type NewPostInput = z.infer<typeof NewPostInputSchema>
