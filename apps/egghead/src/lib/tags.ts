import { z } from 'zod'

// Egghead tag schema - this is what we use
export const EggheadApiTagSchema = z.object({
	id: z.number(),
	label: z.string().nullable(),
	name: z.string(),
	description: z.string().nullable(),
	slug: z.string(),
	image_url: z.string().nullish().default(null),
	contexts: z.array(z.string()).default([]),
})

export const EggheadDbTagSchema = z.object({
	id: z.number(),
	url: z.string().nullable(),
	popularity_order: z.number().nullable(),
	updated_at: z.coerce.date(),
})

export const EggheadTagFieldsSchema = EggheadApiTagSchema.merge(
	EggheadDbTagSchema.partial(),
)

export const EggheadTagSchema = z.object({
	id: z.string(),
	type: z.literal('topic'),
	fields: EggheadTagFieldsSchema,
	createdAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
	updatedAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
})

export type EggheadTag = z.infer<typeof EggheadTagSchema>

// Export as Tag for component compatibility
export type Tag = EggheadTag
