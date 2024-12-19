import { z } from 'zod'

export const TagFieldsSchema = z.object({
	name: z.string(),
	label: z.string(),
	description: z.string().nullable(),
	slug: z.string(),
	image_url: z.string().url().nullable(),
	contexts: z.array(z.string()),
	url: z.string().nullable(),
	popularity_order: z.number().nullable(),
})

export type TagFields = z.infer<typeof TagFieldsSchema>

export const TagSchema = z.object({
	id: z.string(),
	type: z.literal('topic'),
	fields: TagFieldsSchema,
	createdAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
	updatedAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
})

export type Tag = z.infer<typeof TagSchema>
