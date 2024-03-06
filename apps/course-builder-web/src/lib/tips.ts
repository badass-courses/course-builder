import { guid } from '@/utils/guid'
import { z } from 'zod'

export const TipStateSchema = z.union([
  z.literal('draft'),
  z.literal('published'),
  z.literal('archived'),
  z.literal('deleted'),
])

export const TipVisibilitySchema = z.union([z.literal('public'), z.literal('private'), z.literal('unlisted')])

export const TipSchema = z.object({
  _id: z.string(),
  _type: z.literal('tip'),
  _updatedAt: z.string(),
  title: z.string(),
  summary: z.string().optional().nullable(),
  body: z.string().nullable(),
  videoResourceId: z.string().nullable().optional(),
  state: TipStateSchema.default('draft'),
  visibility: TipVisibilitySchema.default('unlisted'),
  slug: z.string(),
})

export type Tip = z.infer<typeof TipSchema>

export const MigratedTipResourceSchema = z.object({
  createdById: z.string(),

  type: z.string(),

  id: z.string(),
  updatedAt: z.date(),
  resources: z.array(z.object({ type: z.literal('videoResource'), id: z.string() })).default([]),
  fields: z
    .object({
      slug: z.string(),
      title: z.string(),
      body: z.string().nullable().optional(),
      state: z.string(),
      visibility: z.string(),
      summary: z.string().optional().nullable(),
    })
    .default({ title: 'New Tip', slug: `tip-${guid()}`, state: 'draft', visibility: 'unlisted', summary: null }),
})

export function convertToMigratedTipResource({ tip, ownerUserId }: { tip: Tip; ownerUserId: string }) {
  return MigratedTipResourceSchema.parse({
    createdById: ownerUserId,
    type: 'tip',
    id: tip._id,
    updatedAt: new Date(tip._updatedAt),
    resources: tip.videoResourceId
      ? [
          {
            type: 'videoResource',
            id: tip.videoResourceId,
          },
        ]
      : [],
    fields: {
      slug: tip.slug,
      title: tip.title,
      body: tip.body,
      state: tip.state,
      visibility: tip.visibility,
      ...(tip.summary && { summary: tip.summary }),
    },
  })
}

export const NewTipSchema = z.object({
  title: z.string().min(2).max(90),
  videoResourceId: z.string().min(4, 'Please upload a video'),
})

export type NewTip = z.infer<typeof NewTipSchema>

export const TipUpdateSchema = z.object({
  _id: z.string(),
  title: z.string().min(2).max(90),
  body: z.string().optional().nullable(),
})

export type TipUpdate = z.infer<typeof TipUpdateSchema>
