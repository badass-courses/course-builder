import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import {
	POST_SUBTYPES,
	POST_TYPES_WITH_VIDEO,
	PostType,
	PostTypeSchema,
} from './resource-types'
import { TagSchema } from './tags'

export const PostActionSchema = z.union([
	z.literal('publish'),
	z.literal('unpublish'),
	z.literal('archive'),
	z.literal('save'),
])

export type PostAction = z.infer<typeof PostActionSchema>

// Re-export for backward compatibility
export { POST_TYPES_WITH_VIDEO, PostTypeSchema }
export type { PostType }

export const NewPostInputSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	videoResourceId: z.string().optional(),
	postType: z.string().refine(
		(type) => POST_SUBTYPES.includes(type as PostType),
		(type) => ({
			message: `Invalid post type: ${type}. Valid types are: ${POST_SUBTYPES.join(', ')}`,
		}),
	),
	createdById: z.string(),
	parentLessonId: z.string().optional(),
})

export type NewPostInput = z.infer<typeof NewPostInputSchema>

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

export const FeaturedLayoutSchema = z.union([
	z.literal('primary'),
	z.literal('secondary'),
	z.literal('tertiary'),
])

export const FeaturedSchema = z.object({
	priority: z.number(),
	layout: FeaturedLayoutSchema,
})

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			postType: PostTypeSchema.default('article'),
			body: z.string().nullable().optional(),
			yDoc: z.string().nullable().optional(),
			title: z.string(),
			summary: z.string().optional().nullable(),
			description: z.string().nullish(),
			slug: z.string(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('public'),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
			thumbnailTime: z.number().nullish(),
			featured: FeaturedSchema.optional(),
		}),
		tags: PostTagsSchema,
	}),
)

export type Post = z.infer<typeof PostSchema>

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		postType: PostTypeSchema.default('article'),
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
		slug: z.string(),
		description: z.string().nullish(),
		state: PostStateSchema.optional(),
		visibility: PostVisibilitySchema.optional(),
		github: z.string().nullish(),
		thumbnailTime: z.number().nullish(),
	}),
	tags: PostTagsSchema,
	videoResourceId: z.string().optional().nullable(),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>

export const CreatePostRequestSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	postType: PostTypeSchema,
	createdById: z.string().optional(),
})

export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>

export const UpdatePostRequestSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2, 'Title must be at least 2 characters'),
		body: z.string().optional(),
		slug: z.string(),
		description: z.string().nullish(),
		state: PostStateSchema.default('draft'),
		visibility: PostVisibilitySchema.default('unlisted'),
		github: z.string().nullish(),
		thumbnailTime: z.number().nullish(),
	}),
})

export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>
