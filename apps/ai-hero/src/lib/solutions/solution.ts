import { z } from 'zod'

import { PostSchema, PostTypeSchema } from '../posts'

/**
 * Schema for a solution, extending the base post schema
 * Solutions are tied to lessons and provide additional content/explanation
 */
export const SolutionSchema = PostSchema.merge(
	z.object({
		fields: z.object({
			postType: z.literal('solution'),
			parentLessonId: z.string(),
		}),
	}),
).refine(
	(data) => {
		// Ensure solution type is correct
		return data.fields.postType === 'solution'
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
