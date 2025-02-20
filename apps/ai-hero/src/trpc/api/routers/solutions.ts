import { getParentLesson } from '@/lib/solutions/solution-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const solutionsRouter = createTRPCRouter({
	getParentLesson: publicProcedure
		.input(
			z.object({
				solutionId: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return await getParentLesson(input.solutionId)
		}),
})
