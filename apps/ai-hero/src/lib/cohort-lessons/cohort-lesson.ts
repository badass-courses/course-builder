import { z } from 'zod'

import { PostSchema } from '../posts'

/**
 * Schema for a cohort lesson, extending the base post schema
 * Cohort lessons are tied to cohorts through the contentResourceResource join table
 */
export const CohortLessonSchema = PostSchema.extend({
	fields: z.object({
		postType: z.literal('cohort-lesson'),
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
		position: z.number().optional(),
	}),
}).refine(
	(data) => {
		return data.fields.postType === 'cohort-lesson'
	},
	{
		message: 'Invalid post type for cohort lesson',
		path: ['fields', 'postType'],
	},
)

export type CohortLesson = z.infer<typeof CohortLessonSchema>

/**
 * Input schema for creating a new cohort lesson
 */
export const CreateCohortLessonSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	cohortId: z.string(), // Used for creating the relationship in contentResourceResource
	createdById: z.string().optional(),
	position: z.number().optional(),
})

export type CreateCohortLessonInput = z.infer<typeof CreateCohortLessonSchema>

/**
 * Input schema for updating an existing cohort lesson
 */
export const UpdateCohortLessonSchema = z.object({
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
		position: z.number().optional(),
	}),
})

export type UpdateCohortLessonInput = z.infer<typeof UpdateCohortLessonSchema>
