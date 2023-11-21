import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {createTRPCRouter, publicProcedure} from '@/trpc/api/trpc'
import {inngest} from '@/inngest/inngest.server'
import {AI_WRITING_REQUESTED_EVENT} from '@/inngest/events'
import {sanityQuery} from '@/server/sanity.server'
import {POST_CREATION_REQUESTED_EVENT} from '@/inngest/events/sanity-post'

export const postRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      const {transcript} = await sanityQuery(
        `*[_type == "videoResource" && _id == "${input.requestId}"][0]`,
      )

      await inngest.send({
        name: AI_WRITING_REQUESTED_EVENT,
        data: {
          requestId: input.requestId,
          input: {
            input: transcript,
          },
        },
      })
    }),
  create: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        title: z.string(),
        body: z.string(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      await inngest.send({
        name: POST_CREATION_REQUESTED_EVENT,
        data: {
          requestId: input.requestId,
          content: input.body,
          title: input.title,
        },
      })
    }),
})
