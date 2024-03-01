import { revalidateTag } from 'next/cache'
import { ARTICLE_CHAT_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { ArticleSchema, convertToMigratedArticleResource, getArticle } from '@/lib/articles'
import { FeedbackMarkerSchema } from '@/lib/feedback-marker'
import { getServerAuthSession } from '@/server/auth'
import { db } from '@/server/db'
import { contentResource } from '@/server/db/schema'
import { redis } from '@/server/redis-client'
import { sanityMutation } from '@/server/sanity.server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
import slugify from '@sindresorhus/slugify'
import { Ratelimit } from '@upstash/ratelimit'
import { eq } from 'drizzle-orm'
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
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const user = session?.user
      const ability = getAbility({ user })
      if (!user || !ability.can('create', 'Content')) {
        throw new Error('Unauthorized')
      }

      const newArticleId = v4()

      await sanityMutation([
        {
          createOrReplace: {
            _id: newArticleId,
            _type: 'article',
            state: 'draft',
            visibility: 'unlisted',
            title: input.title,
            slug: {
              current: slugify(`${input.title}~${nanoid()}`),
            },
          },
        },
      ])

      const article = await getArticle(newArticleId)

      if (article && session?.user) {
        db.insert(contentResource).values(convertToMigratedArticleResource({ article, ownerUserId: session.user.id }))
      }

      revalidateTag('articles')

      return article
    }),
  update: protectedProcedure.input(ArticleSchema).mutation(async ({ ctx, input }) => {
    const session = await getServerAuthSession()
    const user = session?.user
    const ability = getAbility({ user })
    if (!user || !ability.can('update', 'Content')) {
      throw new Error('Unauthorized')
    }

    const currentArticle = await getArticle(input._id)

    if (input.title !== currentArticle?.title) {
      const splitSlug = currentArticle?.slug.split('~') || ['', nanoid()]
      await sanityMutation([
        {
          patch: {
            id: input._id,
            set: {
              'slug.current': `${slugify(input.title)}~${splitSlug[1]}`,
              title: input.title,
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
    ).then((res) => res.results[0].document)

    revalidateTag('articles')

    const updatedArticle = await getArticle(input._id)

    if (updatedArticle) {
      const dbArticle = convertToMigratedArticleResource({ article: updatedArticle, ownerUserId: user.id })
      console.log('updating article', { dbArticle })
      console.log(await db.update(contentResource).set(dbArticle).where(eq(contentResource.id, updatedArticle._id)))
    }

    return updatedArticle
  }),
})
