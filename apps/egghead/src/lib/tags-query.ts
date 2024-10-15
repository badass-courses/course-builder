import { unstable_cache } from 'next/cache'
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

export async function getTags(): Promise<EggheadTag[]> {
	const tags = await db.query.tag.findMany()
	return z.array(EggheadTagSchema).parse(tags)
}

export const getAllCachedEggheadTags = unstable_cache(
	async () => getAllEggheadTags(),
	['tags'],
	{ revalidate: 3600, tags: ['tags'] },
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
			createdAt: updated_at ?? null,
			updatedAt: updated_at ?? null,
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
		label: z.string(),
		description: z.string().nullable(),
		slug: z.string(),
		image_url: z.string().url().nullable(),
		contexts: z.array(z.string()),
		url: z.string().nullable(),
		popularity_order: z.number().nullable(),
	}),
})

type CreateTagInput = z.infer<typeof CreateTagSchema>

export async function createTag(input: CreateTagInput): Promise<EggheadTag> {
	// Validate input
	const validatedInput = CreateTagSchema.parse(input)

	// Insert into PostgreSQL
	const pgResult = await eggheadPgQuery(
		`
    INSERT INTO tags (name, label, description, slug, image_file_name, url, context, popularity_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, updated_at
  `,
		[
			validatedInput.fields.name,
			validatedInput.fields.label,
			validatedInput.fields.description,
			validatedInput.fields.slug,
			validatedInput.fields.image_url,
			validatedInput.fields.url,
			validatedInput.fields.contexts.join(','),
			validatedInput.fields.popularity_order,
		],
	)

	const { id, updated_at } = pgResult.rows[0]

	// Construct the tag object
	const newTag: EggheadTag = {
		id: `tag_${id}`,
		type: 'topic',
		fields: {
			...validatedInput.fields,
			id: Number(id),
		},
		createdAt: updated_at,
		updatedAt: updated_at,
	}

	// Insert into Drizzle ORM database
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

	return updatedTag
}
