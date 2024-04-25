import { z } from 'zod'

import { ContentResourceSchema } from './content-resource-schema'
import { priceSchema } from './price-schema'

export const productSchema = z.object({
	id: z.string().max(191),
	name: z.string().max(191),
	key: z.string().max(191).optional().nullable(),
	fields: z.record(z.any()).default({}),
	createdAt: z.date().nullable(),
	status: z.number().int().default(0),
	quantityAvailable: z.number().int().default(-1),
	price: priceSchema.nullable().optional(),
	resources: z.array(ContentResourceSchema).default([]).nullable(),
})

export type Product = z.infer<typeof productSchema>
