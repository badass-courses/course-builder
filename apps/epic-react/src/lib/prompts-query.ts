'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { NewPrompt, Prompt, PromptSchema } from '@/lib/prompts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, eq, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getPrompts(): Promise<Prompt[]> {
	const prompts = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'prompt'),
	})

	const promptsParsed = z.array(PromptSchema).safeParse(prompts)
	if (!promptsParsed.success) {
		console.error('Error parsing prompts', JSON.stringify(promptsParsed))
		return []
	}

	return promptsParsed.data
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
			title: input.fields.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.fields.title}~${guid()}`),
		},
		createdById: user.id,
	})

	const prompt = await getPrompt(newPromptId)

	revalidateTag('prompts', 'max')

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

	let promptSlug = input.fields.slug

	if (input.fields.title !== currentPrompt?.fields.title) {
		const splitSlug = currentPrompt?.fields.slug.split('~') || ['', guid()]
		promptSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentPrompt.id,
		fields: {
			...currentPrompt.fields,
			...input.fields,
			slug: promptSlug,
		},
	})
}

export async function getPrompt(slugOrId: string): Promise<Prompt | null> {
	const prompt = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.type, 'prompt'),
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					`${slugOrId}`,
				),
				eq(contentResource.id, slugOrId),
			),
		),
	})

	const parsed = PromptSchema.safeParse(prompt)

	if (!parsed.success) {
		console.error('Error parsing prompt', prompt)
		return null
	}

	return parsed.data
}
