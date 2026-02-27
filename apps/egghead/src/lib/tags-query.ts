'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { tag as tagTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
	EggheadApiTagSchema,
	EggheadDbTagSchema,
	EggheadTag,
	EggheadTagSchema,
	Tag,
} from './tags'

/*
This is the SQL schema for the tags table in the egghead postgres database

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS tags_id_seq;

-- Table Definition
CREATE TABLE "public"."tags" (
    "id" int4 NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
    "name" varchar,
    "taggings_count" int4 DEFAULT 0,
    "image_file_name" varchar,
    "image_content_type" varchar,
    "image_file_size" int4,
    "image_updated_at" timestamp,
    "slug" varchar,
    "description" text,
    "url" text,
    "label" varchar,
    "popularity_order" int4,
    "updated_at" timestamp,
    "context" varchar,
    PRIMARY KEY ("id")
);
*/

export async function getTags(): Promise<Tag[]> {
	const tags = await db.query.tag.findMany()
	return z.array(EggheadTagSchema).parse(tags)
}

export const getAllEggheadTagsCached = unstable_cache(
	async () => getAllEggheadTags(),
	['tags'],
	{ revalidate: 60, tags: ['tags'] },
)

export async function getAllEggheadTags(): Promise<EggheadTag[]> {
	const response = await fetch('https://app.egghead.io/api/v1/tags')
	const apiData = z.array(EggheadApiTagSchema).parse(await response.json())
	const allTagIds = apiData.map((tag) => tag.id)

	const tagRows = await eggheadPgQuery(
		`SELECT * FROM tags WHERE id IN (${allTagIds.join(',')})`,
	)

	const dbData = z.array(EggheadDbTagSchema).parse(tagRows.rows)

	// Create a map of DB data for easy lookup
	const dbDataMap = new Map(dbData.map((tag) => [tag.id, tag]))

	// Merge API data with DB data and fit into the new schema
	const mergedTags = apiData.map((apiTag): EggheadTag => {
		const { url, popularity_order, updated_at } = dbDataMap.get(apiTag.id) ?? {}
		const { id, ...tagFields } = apiTag
		return {
			id: `tag_${id}`, // Convert to string to match the new schema
			type: 'topic',
			fields: {
				...tagFields,
				url: url ?? null,
				popularity_order: popularity_order ?? null,
			},
			createdAt: updated_at ?? new Date(),
			updatedAt: updated_at ?? new Date(),
		}
	})

	for (const checkTag of mergedTags) {
		const existingTag = await db.query.tag.findFirst({
			where: eq(tagTable.id, checkTag.id),
		})
		if (!existingTag) {
			await db.insert(tagTable).values(checkTag)
		}
	}

	return mergedTags
}

const CreateTagSchema = z.object({
	type: z.literal('topic'),
	fields: z.object({
		name: z.string(),
		label: z.string().nullable(),
		description: z.string().nullish(),
		slug: z.string(),
		image_url: z.string().nullish(),
		contexts: z.array(z.string()).nullish(),
		url: z.string().nullish(),
		popularity_order: z.number().nullish(),
	}),
})

type CreateTagInput = z.infer<typeof CreateTagSchema>

export async function createTag(input: CreateTagInput): Promise<Tag> {
	// Validate input
	const validatedInput = CreateTagSchema.parse(input)

	// Generate a unique ID for the new tag
	const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

	// Create egghead tag
	const newTag: EggheadTag = {
		id,
		type: 'topic',
		fields: {
			name: validatedInput.fields.name,
			label: validatedInput.fields.label,
			description: validatedInput.fields.description ?? null,
			slug: validatedInput.fields.slug,
			image_url: validatedInput.fields.image_url ?? null,
			contexts: validatedInput.fields.contexts ?? [],
			url: validatedInput.fields.url ?? null,
			popularity_order: validatedInput.fields.popularity_order ?? null,
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	// Insert into database
	await db.insert(tagTable).values(newTag)

	return newTag
}

const UpdateTagSchema = z.object({
	id: z.string(),
	type: z.literal('topic'),
	fields: z.object({
		name: z.string().optional(),
		label: z.string().optional(),
		description: z.string().nullable().optional(),
		slug: z.string().optional(),
		image_url: z.string().url().nullable().optional(),
		contexts: z.array(z.string()).optional().default([]),
		url: z.string().nullable().optional(),
		popularity_order: z.number().nullable().optional(),
	}),
})

type UpdateTagInput = z.infer<typeof UpdateTagSchema>

export async function updateTag(input: UpdateTagInput): Promise<EggheadTag> {
	// Validate input
	const validatedInput = UpdateTagSchema.parse(input)

	// Extract the numeric ID from the string ID
	const numericId = parseInt(validatedInput.id.split('_')[1] as string, 10)

	// Prepare update fields for PostgreSQL
	const updateFields: string[] = []
	const updateValues: any[] = []
	let paramCounter = 1

	if (validatedInput.fields) {
		Object.entries(validatedInput.fields).forEach(([key, value]) => {
			if (value) {
				if (key === 'contexts') {
					updateFields.push(`context = $${paramCounter}`)
					updateValues.push(Array.isArray(value) ? value.join(',') : value)
				} else {
					updateFields.push(
						`${key === 'image_url' ? 'image_file_name' : key} = $${paramCounter}`,
					)
					updateValues.push(value)
				}
				paramCounter++
			}
		})
	}

	// Update PostgreSQL
	const pgResult = await eggheadPgQuery(
		`
    UPDATE tags
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCounter}
    RETURNING *
  `,
		[...updateValues, numericId],
	)

	const updatedPgTag = pgResult.rows[0]

	// Construct the updated tag object
	const updatedTag: EggheadTag = {
		id: validatedInput.id,
		type: 'topic',
		fields: {
			id: updatedPgTag.id,
			name: updatedPgTag.name,
			label: updatedPgTag.label,
			description: updatedPgTag.description,
			slug: updatedPgTag.slug,
			image_url: updatedPgTag.image_file_name,
			contexts: updatedPgTag.context ? updatedPgTag.context.split(',') : [],
			url: updatedPgTag.url,
			popularity_order: updatedPgTag.popularity_order,
		},
		createdAt: updatedPgTag.created_at || null,
		updatedAt: updatedPgTag.updated_at,
	}

	// Update Drizzle ORM database
	await db
		.update(tagTable)
		.set(updatedTag)
		.where(eq(tagTable.id, updatedTag.id))

	revalidateTag('tags', 'max')
	return updatedTag
}
