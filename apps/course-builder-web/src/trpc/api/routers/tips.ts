import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {createTRPCRouter, publicProcedure} from '@/trpc/api/trpc'
import {getTip, getTipsModule} from '@/lib/tips'
import {sanityMutation} from '@/server/sanity.server'
import {v4} from 'uuid'

function toChicagoTitleCase(slug: string): string {
  const minorWords: Set<string> = new Set([
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
  create: publicProcedure
    .input(
      z.object({
        videoResourceId: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      console.log('tipsRouter', input)

      const newTipId = v4()

      // await sanityMutation([
      //   {
      //     createOrReplace: {
      //       _id: event.data.fileName,
      //       _type: 'videoResource',
      //       originalMediaUrl: event.data.originalMediaUrl,
      //       title: event.data.fileName,
      //       muxAssetId: muxAsset.id,
      //       muxPlaybackId: playbackId,
      //       state: `processing`,
      //     },
      //   },
      // ])

      await sanityMutation([
        {
          createOrReplace: {
            _id: newTipId,
            _type: 'tip',
            title: toChicagoTitleCase(input.videoResourceId),
            slug: {
              current: input.videoResourceId,
            },
            resources: [
              {
                _key: v4(),
                _type: 'reference',
                _ref: input.videoResourceId,
              },
            ],
            summary: input.description,
          },
        },
      ])

      const tip = await getTip(newTipId)

      console.log('tip', tip)

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
})
