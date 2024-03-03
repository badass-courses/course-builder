import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { guid } from '@/utils/guid'
import { sql } from 'drizzle-orm'
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
  videoResourceId: z.string().nullable(),
  state: TipStateSchema.default('draft'),
  visibility: TipVisibilitySchema.default('unlisted'),
  slug: z.string(),
})

export type Tip = z.infer<typeof TipSchema>

export async function getTip(slug: string): Promise<Tip | null> {
  const query = sql`
    SELECT
      tips.id as _id,
      tips.type as _type,
      tips.slug,
      CAST(tips.updatedAt AS DATETIME) as _updatedAt,
      JSON_EXTRACT (tips.metadata, "$.title") AS title,
      JSON_EXTRACT (tips.metadata, "$.body") AS body,
      JSON_EXTRACT (tips.metadata, "$.state") AS state,
      JSON_EXTRACT (tips.metadata, "$.visibility") AS visibility,
      refs.id as videoResourceId
    FROM
      ${contentResource} as tips,
      JSON_TABLE (
        tips.resources,
        '$[*]' COLUMNS (
          _type VARCHAR(255) PATH '$._type',
          _ref VARCHAR(255) PATH '$._ref'
        )
      ) AS videoResources
    LEFT JOIN ${contentResource} as refs ON videoResources._ref = refs.id
      AND refs.type = 'videoResource'
    WHERE
      tips.type = 'tip'
      AND refs.type = 'videoResource'
      AND (tips.slug = ${slug} OR tips.id = ${slug});
  `
  return db
    .execute(query)
    .then((result) => {
      const parsedTip = TipSchema.safeParse(result.rows[0])
      return parsedTip.success ? parsedTip.data : null
    })
    .catch((error) => {
      return error
    })
}

export async function getTipsModule(): Promise<Tip[]> {
  const query = sql<Tip[]>`
    SELECT
      tips.id as _id,
      tips.type as _type,
      tips.slug,
      CAST(tips.updatedAt AS DATETIME) as _updatedAt,
      JSON_EXTRACT (tips.metadata, "$.title") AS title,
      JSON_EXTRACT (tips.metadata, "$.body") AS body,
      JSON_EXTRACT (tips.metadata, "$.state") AS state,
      JSON_EXTRACT (tips.metadata, "$.visibility") AS visibility,
      refs.id as videoResourceId
    FROM
      ${contentResource} as tips,
      JSON_TABLE (
        tips.resources,
        '$[*]' COLUMNS (
          _type VARCHAR(255) PATH '$._type',
          _ref VARCHAR(255) PATH '$._ref'
        )
      ) AS videoResources
    LEFT JOIN ${contentResource} as refs ON videoResources._ref = refs.id
      AND refs.type = 'videoResource'
    
    WHERE
      tips.type = 'tip'
      AND refs.type = 'videoResource'
    ORDER BY tips.updatedAt DESC;
  `
  return db
    .execute(query)
    .then((result) => {
      const parsedTips = z.array(TipSchema).safeParse(result.rows)
      return parsedTips.success ? parsedTips.data : []
    })
    .catch((error) => {
      throw error
    })
}

export const MigratedTipResourceSchema = z.object({
  createdById: z.string(),

  type: z.string(),
  slug: z.string(),

  id: z.string(),
  updatedAt: z.date(),
  resources: z.array(z.object({ _type: z.string(), _ref: z.string() })).default([]),
  metadata: z
    .object({
      title: z.string(),
      body: z.string().nullable().optional(),
      state: z.string(),
      visibility: z.string(),
      summary: z.string().optional().nullable(),
    })
    .default({ title: 'New Tip', state: 'draft', visibility: 'unlisted', summary: null }),
})

export function convertToMigratedTipResource({ tip, ownerUserId }: { tip: Tip; ownerUserId: string }) {
  return MigratedTipResourceSchema.parse({
    createdById: ownerUserId,
    type: 'tip',
    slug: tip.slug,
    id: tip._id,
    updatedAt: new Date(tip._updatedAt),
    resources: tip.videoResourceId
      ? [
          {
            _type: 'reference',
            _ref: tip.videoResourceId,
            key: `videoResource-${guid()}`,
          },
        ]
      : [],
    metadata: {
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
