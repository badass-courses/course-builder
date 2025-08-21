import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'

export const ExerciseSchema = ContentResourceSchema.extend({
	type: z.literal('exercise'),
	fields: z
		.object({
			workshopApp: z
				.object({
					path: z.string().optional(),
				})
				.optional(),
		})
		.nullish()
		.default({}),
})
export type Exercise = z.infer<typeof ExerciseSchema>

export const ExerciseUpdateSchema = z.object({
	fields: z.object({
		workshopApp: z
			.object({
				path: z.string().optional(),
			})
			.optional(),
	}),
})
export const NewExerciseInputSchema = z.object({
	workshopApp: z
		.object({
			path: z.string().optional(),
		})
		.optional(),
	parentResourceId: z.string(),
	createdById: z.string().optional(),
})

export type NewExerciseInput = z.infer<typeof NewExerciseInputSchema>

export const UpdateExerciseInputSchema = z.object({
	workshopApp: z
		.object({
			path: z.string().optional(),
		})
		.optional(),
})
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseInputSchema>
