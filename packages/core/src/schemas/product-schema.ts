import { z } from 'zod'

import { ContentResourceSchema } from './content-resource-schema'
import { priceSchema } from './price-schema'

export const productSchema = z.object({
	id: z.string().max(191),
	name: z.string().max(191),
	key: z.string().max(191).optional().nullable(),
	fields: z.object({
		body: z.string().nullable().optional(),
		description: z.string().optional().nullable(),
		slug: z.string(),
		image: z.object({
			url: z.string().url(),
			alt: z.string().optional().nullable(),
		}),
		action: z.string().optional().nullable().default('Buy Now'),
		state: z
			.enum(['draft', 'published', 'archived', 'deleted'])
			.default('draft'),
		visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
		type: z.enum(['live', 'self-paced']).default('self-paced'),
	}),
	createdAt: z.date().nullable(),
	status: z.number().int().default(0),
	quantityAvailable: z.number().int().default(-1),
	price: priceSchema.nullable().optional(),
	resources: z.array(ContentResourceSchema).default([]).nullable(),
})

export type Product = z.infer<typeof productSchema>
