import { courseBuilderAdapter } from '@/db'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const videoResourceRouter = createTRPCRouter({
	get: publicProcedure
		.input(
			z.object({
				videoResourceId: z.string().nullable().optional(),
			}),
		)
		.query(async ({ input }) => {
			return courseBuilderAdapter.getVideoResource(input.videoResourceId)
		}),
})
