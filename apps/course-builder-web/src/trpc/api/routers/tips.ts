import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/trpc/api/trpc'
import {getTip, getTipsModule} from '@/lib/tips'
import {sanityMutation} from '@/server/sanity.server'
import {v4} from 'uuid'
import slugify from '@sindresorhus/slugify'

import {customAlphabet} from 'nanoid'
import {inngest} from '@/inngest/inngest.server'
import {AI_TIP_WRITING_REQUESTED_EVENT} from '@/inngest/events'
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

function toChicagoTitleCase(slug: string): string {
  const minorWords = new Set<string>([
    'and',
    'but',
    'for',
    'or',
    'nor',
    'the',
    'a',
    'an',
    'as',
    'at',
    'by',
    'for',
    'in',
    'of',
    'on',
    'per',
    'to',
  ])

  return slug
    .replace(/-/g, ' ')
    .split(' ')
    .map((word, index, array) => {
      if (
        index > 0 &&
        index < array.length - 1 &&
        minorWords.has(word.toLowerCase())
      ) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
    })
    .join(' ')
}

export const tipsRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        tipId: z.string(),
      }),
    )
    .query(async ({ctx, input}) => {
      return await getTip(input.tipId)
    }),
  create: protectedProcedure
    .input(
      z.object({
        videoResourceId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      const newTipId = v4()

      await sanityMutation([
        {
          createOrReplace: {
            _id: newTipId,
            _type: 'tip',
            title: toChicagoTitleCase(input.title),
            slug: {
              current: slugify(`${input.title}~${nanoid()}`),
            },
            resources: [
              {
                _key: v4(),
                _type: 'reference',
                _ref: input.videoResourceId,
              },
            ],
          },
        },
      ])

      const tip = await getTip(newTipId)

      const tipsModule = await getTipsModule()

      await sanityMutation([
        {
          patch: {
            id: tipsModule._id,
            setIfMissing: {resources: []},
            insert: {
              before: 'resources[0]',
              items: [
                {
                  _key: v4(),
                  _type: 'reference',
                  _ref: newTipId,
                },
              ],
            },
          },
        },
      ])

      return tip
    }),
  update: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
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

      await sanityMutation([
        {
          patch: {
            id: input.tipId,
            set: {
              'slug.current': `${slugify(input.title)}~${nanoid()}`,
              title: toChicagoTitleCase(input.title),
              body: input.body,
            },
          },
        },
      ])

      return await getTip(input.tipId)
    }),
  generateTitle: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      await inngest.send({
        name: AI_TIP_WRITING_REQUESTED_EVENT,
        data: {
          tipId: input.tipId,
        },
      })

      return await getTip(input.tipId)
    }),
})
