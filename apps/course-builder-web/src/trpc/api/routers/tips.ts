import { TIP_CHAT_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { getTip } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const tipsRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        tipId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getTip(input.tipId)
    }),
  chat: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
        messages: z.array(z.any()),
        selectedWorkflow: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const ability = getAbility({ user: session?.user })
      if (!ability.can('create', 'Content')) {
        throw new Error('Unauthorized')
      }

      await inngest.send({
        name: TIP_CHAT_EVENT,
        data: {
          tipId: input.tipId,
          messages: input.messages,
          session: session,
          selectedWorkflow: input.selectedWorkflow,
        },
        user: session?.user,
      })

      return await getTip(input.tipId)
    }),
})
