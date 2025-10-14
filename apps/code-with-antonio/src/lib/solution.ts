import { z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

import { PostStateSchema, PostTagsSchema, PostVisibilitySchema } from './posts'

/**
 * Schema definition for solution resources.
 * Solutions are special resources that provide working code examples
 * and explanations for workshop lessons.
 */
export const SolutionSchema = ContentResourceSchema.merge(
	z.object({
		id: z.string(),
		type: z.literal('solution'),
		createdById: z.string(),
		createdAt: z.coerce.date().nullable(),
		updatedAt: z.coerce.date().nullable(),
		deletedAt: z.coerce.date().nullable(),
		fields: z.object({
			title: z.string().min(0).max(90),
			body: z.string().optional(),
			slug: z.string(),
			description: z.string().optional(),
			state: z
				.enum(['draft', 'published', 'archived', 'deleted'])
				.default('draft'),
			visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
			videoResourceId: z.string().nullish(),
			thumbnailTime: z.number().nullish(),
			optional: z.boolean().nullish().default(false),
		}),
		resources: z.array(z.any()).default([]).nullable(),
	}),
)

/**
 * Type definition for a Solution resource
 */
export type Solution = z.infer<typeof SolutionSchema>

export const SolutionUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
		slug: z.string(),
		description: z.string().nullish(),
		state: PostStateSchema.default('draft'),
		visibility: PostVisibilitySchema.default('unlisted'),
		github: z.string().nullish(),
		thumbnailTime: z.number().nullish(),
		optional: z.boolean().nullish().default(false),
	}),
	tags: PostTagsSchema,
})
export type SolutionUpdate = z.infer<typeof SolutionUpdateSchema>

export const NewSolutionInputSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	videoResourceId: z.string().optional(),
	body: z.string().optional(),
	slug: z.string(),
	description: z.string().optional(),
	state: PostStateSchema.default('draft'),
	visibility: PostVisibilitySchema.default('unlisted'),
	github: z.string().nullish(),
	thumbnailTime: z.number().nullish(),
	createdById: z.string(),
	parentLessonId: z.string(),
	optional: z.boolean().nullish().default(false),
})

export type NewSolutionInput = z.infer<typeof NewSolutionInputSchema>
