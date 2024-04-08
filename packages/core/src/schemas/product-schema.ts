import { z } from 'zod'

import { priceSchema } from './price-schema'

export const productSchema = z.object({
	id: z.string().max(191),
	name: z.string().max(191),
	key: z.string().max(191).optional().nullable(),
	metadata: z.record(z.any()).default({}),
	createdAt: z.date().nullable(),
	status: z.number().int().default(0),
	quantityAvailable: z.number().int().default(-1),
	price: priceSchema.nullable().optional(),
})

export type Product = z.infer<typeof productSchema>
