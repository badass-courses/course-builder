import { getLessonMuxPlaybackId } from '@/lib/lessons-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const lessonsRouter = createTRPCRouter({
	getLessonMuxPlaybackId: publicProcedure
		.input(
			z.object({
				lessonIdOrSlug: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return await getLessonMuxPlaybackId(input.lessonIdOrSlug)
		}),
})
