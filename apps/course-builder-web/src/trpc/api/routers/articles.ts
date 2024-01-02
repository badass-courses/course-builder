import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/trpc/api/trpc'
import {sanityMutation} from '@/server/sanity.server'
import {v4} from 'uuid'
import slugify from '@sindresorhus/slugify'
import {customAlphabet} from 'nanoid'
import {getArticle} from '@/lib/articles'
import {toChicagoTitleCase} from '@/utils/chicagor-title'
import {inngest} from '@/inngest/inngest.server'
import {ARTICLE_CHAT_EVENT, TIP_CHAT_EVENT} from '@/inngest/events'
import {getTip} from '@/lib/tips'
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const articlesRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        articleId: z.string(),
      }),
    )
    .query(async ({ctx, input}) => {
      return await getArticle(input.articleId)
    }),
  chat: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        messages: z.array(z.any()),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      await inngest.send({
        name: ARTICLE_CHAT_EVENT,
        data: {
          articleId: input.articleId,
          messages: input.messages,
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
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
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
  update: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        title: z.string(),
        body: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      const currentArticle = await getArticle(input.articleId)

      if (input.title !== currentArticle?.title) {
        await sanityMutation([
          {
            patch: {
              id: input.articleId,
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
              id: input.articleId,
              set: {
                body: input.body,
              },
            },
          },
        ],
        {returnDocuments: true},
      )

      return getArticle(input.articleId)
    }),
})
