import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {createTRPCRouter, protectedProcedure} from '@/trpc/api/trpc'
import {inngest} from '@/inngest/inngest.server'
import {BODY_TEXT_UPDATED} from '@/inngest/events'
import {FeedbackMarkerSchema} from '@/lib/feedback-marker'

export const writingRouter = createTRPCRouter({
  generateFeedback: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
        body: z.string().optional().nullable(),
        currentFeedback: z.array(FeedbackMarkerSchema).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('create', 'Content')) {
        throw new Error('Unauthorized')
      }

      await inngest.send({
        name: BODY_TEXT_UPDATED,
        data: {
          resourceId: input.resourceId,
          content: input.body,
          currentFeedback: input.currentFeedback,
        },
      })

      return true
    }),
})
