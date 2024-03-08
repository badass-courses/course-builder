import { getVideoResource } from '@/lib/video-resource-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const videoResourceRouter = createTRPCRouter({
  getById: publicProcedure
    .input(
      z.object({
        videoResourceId: z.string().nullable(),
        moduleSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return input.videoResourceId ? await getVideoResource(input.videoResourceId) : null
    }),
})
