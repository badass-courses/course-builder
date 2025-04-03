import { SolutionSchema } from '@/lib/solution'
import {
	createSolution as createSolutionAction,
	deleteSolution as deleteSolutionAction,
	getLessonForSolution,
	getSolution,
	getSolutionForLesson,
} from '@/lib/solutions-query'
import { log } from '@/server/logger'
import { createTRPCRouter, protectedProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

/**
 * Router for solution-related operations
 * Delegates to server actions for actual implementation
 */
export const solutionsRouter = createTRPCRouter({
	/**
	 * Get a solution for a specific lesson
	 */
	getForLesson: protectedProcedure
		.input(
			z.object({
				lessonId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { lessonId } = input
			return getSolutionForLesson(lessonId)
		}),

	/**
	 * Get a solution by ID or slug
	 */
	getSolution: protectedProcedure
		.input(
			z.object({
				solutionSlugOrId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { solutionSlugOrId } = input
			return getSolution(solutionSlugOrId)
		}),

	/**
	 * Create a new solution linked to a lesson
	 */
	create: protectedProcedure
		.input(
			z.object({
				lessonId: z.string(),
				title: z.string(),
				body: z.string().optional(),
				slug: z.string(),
				description: z.string().optional(),
				videoResourceId: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const solution = await createSolutionAction(input)
				return solution
			} catch (error) {
				log.error('solution.create.trpc.error', { error })
				throw error
			}
		}),

	/**
	 * Delete a solution and remove its link to the lesson
	 */
	delete: protectedProcedure
		.input(
			z.object({
				solutionId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const { solutionId } = input
				return deleteSolutionAction(solutionId)
			} catch (error) {
				log.error('solution.delete.trpc.error', { error })
				throw error
			}
		}),

	/**
	 * Get the parent lesson for a solution
	 */
	getParentLesson: protectedProcedure
		.input(
			z.object({
				solutionId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			try {
				const { solutionId } = input
				return getLessonForSolution(solutionId)
			} catch (error) {
				log.error('solution.getParentLesson.trpc.error', { error })
				throw error
			}
		}),
})
