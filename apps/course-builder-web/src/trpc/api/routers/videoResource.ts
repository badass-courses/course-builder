import { getVideoResource } from '@/lib/video-resource-query'
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
			return getVideoResource(input.videoResourceId)
		}),
})
