import { ARTICLE_CHAT_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { getArticle } from '@/lib/articles-query'
import { FeedbackMarkerSchema } from '@/lib/feedback-marker'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const articlesRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getArticle(input.articleId)
    }),
  chat: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        messages: z.array(z.any()),
        currentFeedback: z.array(FeedbackMarkerSchema).optional(),
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
        name: ARTICLE_CHAT_EVENT,
        data: {
          articleId: input.articleId,
          messages: input.messages,
          currentFeedback: input.currentFeedback,
          session: session,
          selectedWorkflow: input.selectedWorkflow,
        },
        user: session?.user,
      })

      return await getArticle(input.articleId)
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {}),
})
