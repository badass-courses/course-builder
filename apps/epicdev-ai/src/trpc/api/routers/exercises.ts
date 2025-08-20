import {
	NewExerciseInputSchema,
	UpdateExerciseInputSchema,
} from '@/lib/exercises'
import {
	createAndAttachExerciseToLesson,
	getResourceExercises,
	removeAndDetachExerciseFromResource,
	updateExercise,
} from '@/lib/exercises-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const exercisesRouter = createTRPCRouter({
	getResourceExercises: publicProcedure
		.input(
			z.object({
				resourceId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return await getResourceExercises(input.resourceId)
		}),
	createAndAttachExerciseToResource: publicProcedure
		.input(NewExerciseInputSchema)
		.mutation(async ({ input }) => {
			return await createAndAttachExerciseToLesson(input)
		}),
	removeAndDetachExerciseFromResource: publicProcedure
		.input(z.object({ exerciseId: z.string(), parentId: z.string() }))
		.mutation(async ({ input }) => {
			return await removeAndDetachExerciseFromResource(
				input.exerciseId,
				input.parentId,
			)
		}),
	updateExercise: publicProcedure
		.input(
			z.object({
				exerciseId: z.string(),
				input: UpdateExerciseInputSchema,
			}),
		)
		.mutation(async ({ input }) => {
			return await updateExercise(input.exerciseId, input.input)
		}),
})
