'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getAbility } from '@/lib/ability'
import { convertToMigratedTipResource, Tip, TipSchema, type NewTip, type TipUpdate } from '@/lib/tips'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'
import { sanityMutation, sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getTip(slug: string): Promise<Tip | null> {
  const query = sql`
    SELECT
      tips.id as _id,
      tips.type as _type,
      CAST(tips.updatedAt AS DATETIME) as _updatedAt,
      JSON_EXTRACT (tips.fields, "$.slug") AS slug,
      JSON_EXTRACT (tips.fields, "$.title") AS title,
      JSON_EXTRACT (tips.fields, "$.body") AS body,
      JSON_EXTRACT (tips.fields, "$.state") AS state,
      JSON_EXTRACT (tips.fields, "$.visibility") AS visibility,
      refs.resourceId as videoResourceId
    FROM
      ${contentResource} as tips
    LEFT JOIN ${contentResourceResource} as refs ON tips.id = refs.resourceOfId
    WHERE
      tips.type = 'tip'
      AND (JSON_EXTRACT (tips.fields, "$.slug") = ${slug} OR tips.id = ${slug});
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
      CAST(tips.updatedAt AS DATETIME) as _updatedAt,
      JSON_EXTRACT (tips.fields, "$.slug") AS slug,
      JSON_EXTRACT (tips.fields, "$.title") AS title,
      JSON_EXTRACT (tips.fields, "$.body") AS body,
      JSON_EXTRACT (tips.fields, "$.state") AS state,
      JSON_EXTRACT (tips.fields, "$.visibility") AS visibility
    FROM
      ${contentResource} as tips
    WHERE
      tips.type = 'tip'
    ORDER BY tips.updatedAt DESC;
  `
  return db
    .execute(query)
    .then((result) => {
      const parsedTips = z.array(TipSchema).safeParse(result.rows)
      console.log(parsedTips)
      return parsedTips.success ? parsedTips.data : []
    })
    .catch((error) => {
      throw error
    })
}

export async function createTip(input: NewTip) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const user = session?.user

  if (!user || !ability.can('create', 'Content')) {
    throw new Error('Unauthorized')
  }

  const newTipId = v4()

  const videoResource = await getVideoResource(input.videoResourceId)

  await sanityMutation([
    {
      createOrReplace: {
        _id: newTipId,
        _type: 'tip',
        title: input.title,
        state: 'draft',
        visibility: 'unlisted',
        slug: {
          current: slugify(`${input.title}~${guid()}`),
        },
        resources: [
          {
            _key: v4(),
            _type: 'reference',
            _ref: videoResource?._id,
          },
        ],
      },
    },
  ])

  const tip = await sanityQuery<Tip | null>(
    `*[_type == "tip" && (_id == "${newTipId}")][0]{
          _id,
          _type,
          _updatedAt,
          title,
          summary,
          visibility,
          state,
          body,
          "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
          "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
          "transcript": resources[@->._type == 'videoResource'][0]->transcript,
          "slug": slug.current,
  }`,
    { tags: ['tips'] },
  ).catch((error) => {
    console.error('Error fetching tip', error)
    return null
  })

  if (tip) {
    await db.insert(contentResource).values(convertToMigratedTipResource({ tip, ownerUserId: user.id }))
  }

  revalidateTag('tips')

  return tip
}

export async function updateTip(input: TipUpdate) {
  console.log('Updating Tip', input)
  const session = await getServerAuthSession()
  const user = session?.user
  const ability = getAbility({ user })
  if (!user || !ability.can('update', 'Content')) {
    throw new Error('Unauthorized')
  }

  const currentTip = await getTip(input._id)

  console.log('\tCurrent Tip', currentTip)

  if (!currentTip) {
    throw new Error('Not found')
  }

  if (input.title !== currentTip.title) {
    console.log('\ttip title has changed')
    console.log('\t\told: ', currentTip.title)
    console.log('\t\tnew: ', input.title)
    const splitSlug = currentTip?.slug.split('~') || ['', guid()]
    const newSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`

    await sanityMutation([
      {
        patch: {
          id: input._id,
          set: {
            body: input.body,
            slug: {
              current: newSlug,
            },
            title: input.title,
          },
        },
      },
    ])
  } else {
    console.log('\tno title change, updating body')
    await sanityMutation([
      {
        patch: {
          id: input._id,
          set: {
            body: input.body,
          },
        },
      },
    ])
  }

  revalidateTag('tips')
  revalidateTag(input._id)

  const updatedTip = await sanityQuery<Tip | null>(
    `*[_type == "tip" && (_id == "${input._id}")][0]{
          _id,
          _type,
          _updatedAt,
          title,
          summary,
          visibility,
          state,
          body,
          "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
          "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
          "transcript": resources[@->._type == 'videoResource'][0]->transcript,
          "slug": slug.current,
  }`,
    { tags: ['tips', input._id] },
  ).catch((error) => {
    console.error('Error fetching tip', error)
    return null
  })

  if (updatedTip) {
    console.log('\tUpdated Tip: ', user)
    revalidateTag(updatedTip.slug)
    console.log('\trevalidate tag: ', updatedTip.slug)
    revalidatePath(`/tips/${updatedTip.slug}`)
    console.log('\trevalidate path: ', `/tips/${updatedTip.slug}`)
    const { resources, ...updatedContentResource } = convertToMigratedTipResource({
      tip: updatedTip,
      ownerUserId: user.id,
    })
    console.log('\tUpdated Tip Resource: ', updatedContentResource)
    await db
      .update(contentResource)
      .set(updatedContentResource)
      .where(eq(contentResource.id, updatedTip._id))
      .execute()
      .catch((error) => {
        console.error('\tError updating tip', error)
        return null
      })
      .finally(() => {
        console.log('\tUpdated Tip in DB')
      })
  }

  return updatedTip
}
