import { z } from 'zod'

import {
	ContentResourceProductSchema,
	ContentResourceSchema,
} from './content-resource-schema'
import { priceSchema } from './price-schema'

export const productSchema = z.object({
	id: z.string().max(191),
	name: z.string().max(191),
	key: z.string().max(191).optional().nullable(),
	type: z.enum(['live', 'self-paced']).default('self-paced'),
	fields: z.object({
		body: z.string().nullable().optional(),
		description: z.string().optional().nullable(),
		slug: z.string(),
		image: z
			.object({
				url: z.string().url(),
				alt: z.string().optional().nullable(),
				width: z.number().optional().nullable(),
				height: z.number().optional().nullable(),
			})
			.optional()
			.nullable(),
		action: z.string().optional().nullable().default('Buy Now'),
		state: z
			.enum(['draft', 'published', 'archived', 'deleted'])
			.default('draft'),
		visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
	}),
	createdAt: z.date().nullable(),
	status: z.number().int().default(0),
	quantityAvailable: z.number().int().default(-1),
	price: priceSchema.nullable().optional(),
	resources: z.array(ContentResourceProductSchema).default([]).nullable(),
})

export type Product = z.infer<typeof productSchema>
