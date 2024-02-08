import { type VideoResource } from '@/lib/video-resource'
import { sanityQuery } from '@/server/sanity.server'
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
      return input.videoResourceId
        ? await sanityQuery<VideoResource>(`*[_type == "videoResource" && _id == "${input.videoResourceId}"][0]`, {
            useCdn: false,
          })
        : null
    }),
})
