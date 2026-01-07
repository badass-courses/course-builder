import { optional, z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

import { PostStateSchema, PostTagsSchema, PostVisibilitySchema } from './posts'
import { SolutionSchema } from './solution'

export const LessonSchema = ContentResourceSchema.merge(
	z.object({
		id: z.string(),
		type: z.string(),
		createdById: z.string(),
		createdAt: z.coerce.date().nullable(),
		updatedAt: z.coerce.date().nullable(),
		deletedAt: z.coerce.date().nullable(),
		fields: z.object({
			title: z.string().min(2),
			body: z.string().optional(),
			slug: z.string(),
			description: z.string().optional(),
			state: z
				.enum(['draft', 'published', 'archived', 'deleted'])
				.default('draft'),
			visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
			thumbnailTime: z.number().nullish(),
			optional: z.boolean().nullish().default(false),
			prompt: z.string().nullish(),
		}),
		resources: z.array(ContentResourceResourceSchema).default([]).nullable(),
		tags: PostTagsSchema,
	}),
)

export type Lesson = z.infer<typeof LessonSchema>

export const LessonUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
		slug: z.string(),
		description: z.string().nullish(),
		state: PostStateSchema.optional(),
		visibility: PostVisibilitySchema.optional(),
		github: z.string().nullish(),
		thumbnailTime: z.number().nullish(),
		optional: z.boolean().nullish().default(false),
		prompt: z.string().nullish(),
	}),
	tags: PostTagsSchema,
})
export type LessonUpdate = z.infer<typeof LessonUpdateSchema>

// Added schemas and types
export const LessonActionSchema = z.union([
	z.literal('publish'),
	z.literal('unpublish'),
	z.literal('archive'),
	z.literal('save'),
])

export type LessonAction = z.infer<typeof LessonActionSchema>

export const NewLessonInputSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	videoResourceId: z.string().optional(),
	lessonType: z.string(),
	createdById: z.string(),
	parentCourseId: z.string().optional(),
})

export type NewLessonInput = z.infer<typeof NewLessonInputSchema>

export const LessonStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const LessonVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])
