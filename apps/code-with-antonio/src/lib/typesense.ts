import * as z from 'zod'

import { TagSchema } from './tags'

export const TypesenseResourceSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	state: z.string(),
	description: z.string().optional(),
	summary: z.string().optional(),
	visibility: z.string(),
	type: z.string(),
	productType: z.string().optional(),
	published_at_timestamp: z.number().optional(),
	updated_at_timestamp: z.number().optional(),
	created_at_timestamp: z.number().optional(),
	tags: z.array(TagSchema).nullish(),
	image: z.string().optional(),
	startsAt: z.string().optional(),
	endsAt: z.string().optional(),
	parentResources: z
		.array(
			z.object({
				id: z.string(),
				title: z.string(),
				slug: z.string(),
				type: z.string(),
				visibility: z.string(),
				state: z.string(),
			}),
		)
		.nullish(),
})

export const attributeLabelMap: {
	[K in keyof z.infer<typeof TypesenseResourceSchema>]: string
} = {
	description: 'Description',
	summary: 'Summary',
	title: 'Title',
	type: 'Type',
	state: 'State',
	visibility: 'Visibility',
	id: 'ID',
	slug: 'Slug',
	published_at_timestamp: 'Published At',
	updated_at_timestamp: 'Updated At',
	created_at_timestamp: 'Created At',
	tags: 'Tags',
	parentResources: 'Parent Resources',
	productType: 'Product Type',
} as const

export type TypesenseResource = z.infer<typeof TypesenseResourceSchema>
