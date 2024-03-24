'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { NewPrompt, Prompt, PromptSchema } from '@/lib/prompts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getPrompts(): Promise<Prompt[]> {
	const query = sql`
    SELECT
      prompts.id as id,
      prompts.type as type,
      CAST(prompts.updatedAt AS DATETIME) as updatedAt,
      CAST(prompts.createdAt AS DATETIME) as createdAt,
      JSON_EXTRACT (prompts.fields, "$.title") AS title,
      JSON_EXTRACT (prompts.fields, "$.state") AS state,
      JSON_EXTRACT (prompts.fields, "$.slug") AS slug
    FROM
      ${contentResource} as prompts
    WHERE
      prompts.type = 'prompt'
    ORDER BY prompts.createdAt DESC;
  `

	return db
		.execute(query)
		.then((result) => {
			const parsed = z.array(PromptSchema).safeParse(result.rows)
			return parsed.success ? parsed.data : []
		})
		.catch((error) => {
			console.error(error)
			throw error
		})
}

export async function createPrompt(input: NewPrompt) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const newPromptId = v4()

	await db.insert(contentResource).values({
		id: newPromptId,
		type: 'prompt',
		fields: {
			title: input.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.title}~${guid()}`),
		},
		createdById: user.id,
	})

	const prompt = await getPrompt(newPromptId)

	revalidateTag('prompts')

	return prompt
}

export async function updatePrompt(input: Prompt) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentPrompt = await getPrompt(input.id)

	if (!currentPrompt) {
		return createPrompt(input)
	}

	let promptSlug = input.slug

	if (input.title !== currentPrompt?.title) {
		const splitSlug = currentPrompt?.slug.split('~') || ['', guid()]
		promptSlug = `${slugify(input.title)}~${splitSlug[1] || guid()}`
	}

	const query = sql`
    UPDATE ${contentResource}
    SET
      ${contentResource.fields} = JSON_SET(
        ${contentResource.fields},
        '$.title', ${input.title},
        '$.slug', ${promptSlug},
        '$.body', ${input.body},
        '$.state', ${input.state}
      )
    WHERE
      id = ${input.id};
  `

	await db
		.execute(query)
		.then((result) => {
			console.log('Updated Prompt')
		})
		.catch((error) => {
			console.error(error)
			throw error
		})

	revalidateTag('prompts')
	revalidateTag(input.id)
	revalidateTag(promptSlug)
	revalidatePath(`/${promptSlug}`)

	return await getPrompt(input.id)
}

export async function getPrompt(slugOrId: string): Promise<Prompt | null> {
	const query = sql`
    SELECT
      prompts.id as id,
      prompts.type as type,
      CAST(prompts.updatedAt AS DATETIME) as updatedAt,
      CAST(prompts.createdAt AS DATETIME) as createdAt,
      JSON_EXTRACT (prompts.fields, "$.title") AS title,
      JSON_EXTRACT (prompts.fields, "$.state") AS state,
      JSON_EXTRACT (prompts.fields, "$.body") AS body,
      JSON_EXTRACT (prompts.fields, "$.slug") AS slug
    FROM
      ${contentResource} as prompts
    WHERE
      prompts.type = 'prompt' AND (prompts.id = ${slugOrId} OR JSON_EXTRACT (prompts.fields, "$.slug") = ${slugOrId});
  `

	return db
		.execute(query)
		.then((result) => {
			const parsed = PromptSchema.safeParse(result.rows[0])

			if (!parsed.success) {
				console.error('Error parsing prompt', slugOrId)
				console.error(parsed.error)
				return null
			} else {
				return parsed.data
			}
		})
		.catch((error) => {
			console.error(error)
			return error
		})
}
