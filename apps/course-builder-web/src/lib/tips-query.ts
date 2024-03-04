'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { Tip, TipSchema } from '@/lib/tips'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

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
