import { z } from 'zod'

export const EggheadApiTagSchema = z.object({
	id: z.number(),
	label: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	slug: z.string(),
	image_url: z.string().url().nullish().default(null),
	contexts: z.array(z.string()).default([]),
})

export const EggheadDbTagSchema = z.object({
	id: z.number(),
	url: z.string().nullable(),
	popularity_order: z.number().nullable(),
	updated_at: z.date(),
})

export const EggheadTagFieldsSchema = EggheadApiTagSchema.merge(
	EggheadDbTagSchema.partial(),
)

export const EggheadTagSchema = z.object({
	id: z.string(),
	type: z.literal('topic'),
	fields: EggheadTagFieldsSchema,
	createdAt: z.date().nullish(),
	updatedAt: z.date().nullish(),
})

export type EggheadTag = z.infer<typeof EggheadTagSchema>
