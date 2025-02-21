import { z } from 'zod'

import { PostSchema, PostTypeSchema } from '../posts'

/**
 * Schema for a solution, extending the base post schema
 * Solutions are tied to lessons and provide additional content/explanation
 */
export const SolutionSchema = PostSchema.extend({
	fields: z.object({
		postType: z.literal('cohort-lesson-solution'),
		parentLessonId: z.string(),
		title: z.string(),
		body: z.string().nullable().optional(),
		yDoc: z.string().nullable().optional(),
		summary: z.string().optional().nullable(),
		description: z.string().nullish(),
		slug: z.string(),
		state: z.string(),
		visibility: z.string(),
		github: z.string().nullish(),
		gitpod: z.string().nullish(),
		thumbnailTime: z.number().nullish(),
	}),
}).refine(
	(data) => {
		// Ensure solution type is correct
		return data.fields.postType === 'cohort-lesson-solution'
	},
	{
		message: 'Invalid post type for solution',
		path: ['fields', 'postType'],
	},
)

export type Solution = z.infer<typeof SolutionSchema>

/**
 * Input schema for creating a new solution
 */
export const CreateSolutionSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	parentLessonId: z.string(),
	createdById: z.string().optional(),
})

export type CreateSolutionInput = z.infer<typeof CreateSolutionSchema>

/**
 * Input schema for updating an existing solution
 */
export const UpdateSolutionSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2, 'Title must be at least 2 characters'),
		body: z.string().optional(),
		slug: z.string(),
		description: z.string().nullish(),
		state: z.string(),
		visibility: z.string(),
		github: z.string().nullish(),
		thumbnailTime: z.number().nullish(),
	}),
})

export type UpdateSolutionInput = z.infer<typeof UpdateSolutionSchema>
