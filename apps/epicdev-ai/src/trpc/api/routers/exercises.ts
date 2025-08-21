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
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
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
	createAndAttachExerciseToResource: protectedProcedure
		.input(NewExerciseInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await createAndAttachExerciseToLesson({
				...input,
				createdById: ctx.session.user.id,
			})
		}),
	removeAndDetachExerciseFromResource: protectedProcedure
		.input(z.object({ exerciseId: z.string(), parentId: z.string() }))
		.mutation(async ({ input }) => {
			return await removeAndDetachExerciseFromResource(
				input.exerciseId,
				input.parentId,
			)
		}),
	updateExercise: protectedProcedure
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
