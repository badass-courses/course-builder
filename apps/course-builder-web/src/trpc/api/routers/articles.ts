import { revalidateTag } from 'next/cache'
import { ARTICLE_CHAT_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { ArticleSchema, getArticle } from '@/lib/articles'
import { FeedbackMarkerSchema } from '@/lib/feedback-marker'
import { getServerAuthSession } from '@/server/auth'
import { sanityMutation } from '@/server/sanity.server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
import { toChicagoTitleCase } from '@/utils/chicagor-title'
import slugify from '@sindresorhus/slugify'
import { customAlphabet } from 'nanoid'
import { v4 } from 'uuid'
import { z } from 'zod'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

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
        },
      })

      return await getArticle(input.articleId)
    }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const ability = getAbility({ user: session?.user })
      if (!ability.can('create', 'Content')) {
        throw new Error('Unauthorized')
      }

      const newArticleId = v4()

      await sanityMutation([
        {
          createOrReplace: {
            _id: newArticleId,
            _type: 'article',
            state: 'draft',
            title: toChicagoTitleCase(input.title),
            slug: {
              current: slugify(`${input.title}~${nanoid()}`),
            },
          },
        },
      ])

      return getArticle(newArticleId)
    }),
  update: protectedProcedure.input(ArticleSchema).mutation(async ({ ctx, input }) => {
    const session = await getServerAuthSession()
    const ability = getAbility({ user: session?.user })
    if (!ability.can('update', 'Content')) {
      throw new Error('Unauthorized')
    }

    const currentArticle = await getArticle(input._id)

    if (input.title !== currentArticle?.title) {
      await sanityMutation([
        {
          patch: {
            id: input._id,
            set: {
              'slug.current': `${slugify(input.title)}~${nanoid()}`,
              title: toChicagoTitleCase(input.title),
            },
          },
        },
      ])
    }

    await sanityMutation(
      [
        {
          patch: {
            id: input._id,
            set: {
              ...input,
              slug: {
                _type: 'slug',
                current: input.slug,
              },
            },
          },
        },
      ],
      { returnDocuments: true },
    )

    revalidateTag('articles')

    return getArticle(input._id)
  }),
})
