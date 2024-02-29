import { revalidateTag } from 'next/cache'
import { TIP_CHAT_EVENT } from '@/inngest/events'
import { inngest } from '@/inngest/inngest.server'
import { getAbility } from '@/lib/ability'
import { convertToMigratedTipResource, getTip } from '@/lib/tips'
import { getServerAuthSession } from '@/server/auth'
import { db } from '@/server/db'
import { contentResource } from '@/server/db/schema'
import { sanityMutation } from '@/server/sanity.server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/api/trpc'
import { toChicagoTitleCase } from '@/utils/chicagor-title'
import slugify from '@sindresorhus/slugify'
import { eq } from 'drizzle-orm'
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
      const user = session?.user

      if (!user || !ability.can('create', 'Content')) {
        throw new Error('Unauthorized')
      }

      const newTipId = v4()

      await sanityMutation([
        {
          createOrReplace: {
            _id: newTipId,
            _type: 'tip',
            title: input.title,
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

      const tip = await getTip(newTipId)

      if (tip) {
        db.insert(contentResource).values(convertToMigratedTipResource({ tip, ownerUserId: user.id }))
      }

      revalidateTag('tips')

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
    .mutation(async ({ ctx, input }) => {
      const session = await getServerAuthSession()
      const user = session?.user
      const ability = getAbility({ user })
      if (!user || !ability.can('update', 'Content')) {
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

      const updatedTip = await getTip(input.tipId)

      if (updatedTip) {
        db.update(contentResource)
          .set(convertToMigratedTipResource({ tip: updatedTip, ownerUserId: user.id }))
          .where(eq(contentResource.id, updatedTip._id))
      }

      return updatedTip
    }),
})
