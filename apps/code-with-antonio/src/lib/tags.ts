import { z } from 'zod'

export const TagFieldsSchema = z.object({
	name: z.string(),
	label: z.string(),
	description: z.string().nullish(),
	slug: z.string().nullish(),
	image_url: z.string().url().nullish(),
	contexts: z.array(z.string()).nullish(),
	url: z.string().nullish(),
	popularity_order: z.number().nullish(),
})

export type TagFields = z.infer<typeof TagFieldsSchema>

export const TagSchema = z.object({
	id: z.string(),
	type: z.literal('topic').default('topic'),
	organizationId: z.string().nullish(),
	fields: TagFieldsSchema,
	createdAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
	updatedAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
	deleteAt: z
		.union([z.string(), z.date()])
		.transform((val) => new Date(val))
		.nullish(),
})

export type Tag = z.infer<typeof TagSchema>
