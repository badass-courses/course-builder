import { z } from 'zod'

import { priceSchema } from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

export const NewProductSchema = z.object({
	name: z.string().min(2).max(90),
	quantityAvailable: z.coerce.number().default(-1),
	price: z.coerce.number().gte(0).default(0),
})

export type NewProduct = z.infer<typeof NewProductSchema>

export const ProductContentSchema = ContentResourceSchema.merge(
	z.object({
		name: z.string().min(2).max(90),
		status: z.number().int().default(1),
		quantityAvailable: z.number().int().default(-1),
		price: priceSchema.nullable().optional(),
		fields: z.object({
			body: z.string().nullable().optional(),
			description: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			type: z.enum(['live', 'self-paced']),
		}),
	}),
)

export type ProductContent = z.infer<typeof ProductContentSchema>
