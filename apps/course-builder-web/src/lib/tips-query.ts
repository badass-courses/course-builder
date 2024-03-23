'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getAbility } from '@/ability'
import { db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contributionTypes,
} from '@/db/schema'
import { Tip, TipSchema, type NewTip, type TipUpdate } from '@/lib/tips'
import { getVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

export async function deleteTip(id: string) {
	const session = await getServerAuthSession()
	const user = session?.user
	const ability = getAbility({ user })
	if (!user || !ability.can('delete', 'Content')) {
		throw new Error('Unauthorized')
	}

	const tip = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, id),
		with: {
			resources: true,
		},
	})

	if (!tip) {
		throw new Error(`Tip with id ${id} not found.`)
	}

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	revalidateTag('tips')
	revalidateTag(id)
	revalidatePath('/tips')

	return true
}

export async function getTip(slug: string): Promise<Tip | null> {
	const query = sql`
    SELECT
      tips.id,
      tips.type,
      CAST(tips.updatedAt AS DATETIME),
      CAST(tips.createdAt AS DATETIME),
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
      tips.id,
      tips.type,
      CAST(tips.updatedAt AS DATETIME),
      CAST(tips.createdAt AS DATETIME),
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

	const newTipId = `tip_${guid()}`

	const videoResource = await getVideoResource(input.videoResourceId)

	if (!videoResource) {
		throw new Error('🚨 Video Resource not found')
	}

	const resource = await db
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
		.then(() => {
			return db.query.contentResource.findFirst({
				where: eq(contentResource.id, newTipId),
			})
		})
		.catch((error) => {
			console.error('🚨 Error creating tip', error)
			throw error
		})

	const tip = await getTip(newTipId)

	if (tip) {
		await db
			.insert(contentResourceResource)
			.values({ resourceOfId: tip.id, resourceId: input.videoResourceId })

		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.name, 'Author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${guid}`,
				userId: user.id,
				contentId: tip.id,
				contributionTypeId: contributionType.id,
			})
		}

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

	const currentTip = await getTip(input.id)

	if (!currentTip) {
		throw new Error(`Tip with id ${input.id} not found.`)
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
      id = ${input.id};
  `

	await db.execute(query).catch((error) => {
		console.error('🚨 Error updating tip', error)
		throw error
	})

	revalidateTag('tips')
	revalidateTag(input.id)
	revalidateTag(tipSlug)
	revalidatePath(`/tips/${tipSlug}`)

	return await getTip(input.id)
}
