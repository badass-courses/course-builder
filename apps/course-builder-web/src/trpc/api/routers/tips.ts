import { revalidateTag } from 'next/cache'
import { DRAFT_WRITEUP_REQUESTED_EVENT, TIP_CHAT_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { getResource } from '@/lib/resources'
import { getTip } from '@/lib/tips'
import { getServerAuthSession } from '@/server/auth'
import { sanityMutation } from '@/server/sanity.server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
import { toChicagoTitleCase } from '@/utils/chicagor-title'
import slugify from '@sindresorhus/slugify'
import { customAlphabet } from 'nanoid'
import { v4 } from 'uuid'
import { z } from 'zod'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

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
        },
      })

      return await getTip(input.tipId)
    }),
  create: protectedProcedure
    .input(
      z.object({
        videoResourceId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const ability = getAbility({ user: session?.user })
      if (!ability.can('create', 'Content')) {
        throw new Error('Unauthorized')
      }

      const newTipId = v4()

      await sanityMutation([
        {
          createOrReplace: {
            _id: newTipId,
            _type: 'tip',
            title: toChicagoTitleCase(input.title),
            state: 'draft',
            visibility: 'unlisted',
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

      revalidateTag('tips')
      revalidateTag(newTipId)

      return getTip(newTipId)
    }),
  update: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
        title: z.string(),
        body: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const ability = getAbility({ user: session?.user })
      if (!ability.can('update', 'Content')) {
        throw new Error('Unauthorized')
      }

      const currentTip = await getTip(input.tipId)

      if (!currentTip) {
        throw new Error('Not found')
      }

      if (input.title !== currentTip.title) {
        await sanityMutation([
          {
            patch: {
              id: input.tipId,
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
              id: input.tipId,
              set: {
                body: input.body,
              },
            },
          },
        ],
        { returnDocuments: true },
      )

      revalidateTag('tips')
      revalidateTag(input.tipId)

      return await getTip(input.tipId)
    }),
  generateDraft: protectedProcedure.input(z.object({ resourceId: z.string() })).mutation(async ({ ctx, input }) => {
    const session = await getServerAuthSession()
    const ability = getAbility({ user: session?.user })
    if (!ability.can('create', 'Content')) {
      throw new Error('Unauthorized')
    }
    const resource = await getResource(input.resourceId)
    console.log('resource', resource)
    if (!resource) {
      throw new Error('Not found')
    }
    return await inngest.send({
      name: DRAFT_WRITEUP_REQUESTED_EVENT,
      data: {
        requestId: input.resourceId,
        resourceId: input.resourceId,
        transcript: resource.transcript,
      },
    })
  }),
})
