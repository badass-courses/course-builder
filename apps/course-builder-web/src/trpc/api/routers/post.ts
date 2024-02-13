import { POST_CREATION_REQUESTED_EVENT } from '@/inngest/events/sanity-post'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const postRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        title: z.string(),
        body: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const ability = getAbility({ user: session?.user })
      if (!ability.can('create', 'Content')) {
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
