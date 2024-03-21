'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getAbility } from '@/ability'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { Tip, TipSchema, type NewTip, type TipUpdate } from '@/lib/tips'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getTip(slug: string): Promise<Tip | null> {
	const query = sql`
    SELECT
      tips.id as _id,
      tips.type as _type,
      CAST(tips.updatedAt AS DATETIME) as _updatedAt,
      CAST(tips.createdAt AS DATETIME) as _createdAt,
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
      CAST(tips.createdAt AS DATETIME) as _createdAt,
      JSON_EXTRACT (tips.fields, "$.slug") AS slug,
      JSON_EXTRACT (tips.fields, "$.title") AS title,
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

	if (!videoResource) {
		throw new Error('🚨 Video Resource not found')
	}

	await db
		.insert(contentResource)
		.values({
			id: newTipId,
			type: 'tip',
			createdById: user.id,
			fields: {
				title: input.title,
				state: 'draft',
				visibility: 'unlisted',
				slug: slugify(`${input.title}~${guid()}`),
			},
		})
		.then((result) => {
			return result
		})
		.catch((error) => {
			console.error('🚨 Error creating tip', error)
			throw error
		})

	const tip = await getTip(newTipId)

	if (tip) {
		await db
			.insert(contentResourceResource)
			.values({ resourceOfId: tip._id, resourceId: input.videoResourceId })

		revalidateTag('tips')

		return tip
	} else {
		throw new Error('🚨 Error creating tip: Tip not found')
	}
}

export async function updateTip(input: TipUpdate) {
	const session = await getServerAuthSession()
	const user = session?.user
	const ability = getAbility({ user })
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentTip = await getTip(input._id)

	if (!currentTip) {
		throw new Error(`Tip with id ${input._id} not found.`)
	}

	let tipSlug = currentTip.slug

	if (input.title !== currentTip.title) {
		const splitSlug = currentTip?.slug.split('~') || ['', guid()]
		tipSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`
	}

	const query = sql`
    UPDATE ${contentResource}
    SET
      ${contentResource.fields} = JSON_SET(
        ${contentResource.fields},
        '$.title', ${input.title},
        '$.slug', ${tipSlug},
        '$.body', ${input.body}
      )
    WHERE
      id = ${input._id};
  `

	await db.execute(query).catch((error) => {
		console.error('🚨 Error updating tip', error)
		throw error
	})

	revalidateTag('tips')
	revalidateTag(input._id)
	revalidateTag(tipSlug)
	revalidatePath(`/tips/${tipSlug}`)

	return await getTip(input._id)
}
