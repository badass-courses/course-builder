import {z} from 'zod'
import {createTRPCRouter, publicProcedure} from '@/trpc/api/trpc'
import {sanityQuery} from '@/server/sanity.server'
import {VideoResource} from '@/inngest/functions/transcript-ready'

export const videoResourceRouter = createTRPCRouter({
  getById: publicProcedure
    .input(
      z.object({
        videoResourceId: z.string(),
        moduleSlug: z.string().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      return input.videoResourceId
        ? await sanityQuery<VideoResource>(
            `*[_type == "videoResource" && _id == "${input.videoResourceId}"][0]`,
          )
        : null
    }),
})
