'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { db } from '@/db'
import { tag as tagTable } from '@/db/schema'
import { eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { Tag, TagSchema } from './tags'

export async function getTags(): Promise<Tag[]> {
	const tags = await db.query.tag.findMany()
	return z.array(TagSchema).parse(tags)
}

type CreateTagInput = z.infer<typeof TagSchema>

export async function createTag(input: CreateTagInput): Promise<Tag> {
	const validatedInput = TagSchema.parse(input)
	await db.insert(tagTable).values(validatedInput)

	return validatedInput
}

type UpdateTagInput = z.infer<typeof TagSchema>

export async function updateTag(input: UpdateTagInput): Promise<Tag> {
	const validatedInput = TagSchema.parse(input)

	await db
		.update(tagTable)
		.set(validatedInput)
		.where(eq(tagTable.id, validatedInput.id))

	revalidateTag('tags', 'max')
	return validatedInput
}

export async function getTag(slugOrId: string) {
	const tag = await db.query.tag.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT(${tagTable.fields}, "$.slug")`, slugOrId),
			eq(tagTable.id, slugOrId),
		),
	})
	return tag ? TagSchema.parse(tag) : null
}

export const getCachedTag = unstable_cache(
	async (slugOrId: string) => getTag(slugOrId),
	['tag'],
	{ revalidate: 3600, tags: ['tag'] },
)

export const getCachedTags = unstable_cache(async () => getTags(), ['tags'], {
	revalidate: 3600,
	tags: ['tags'],
})
