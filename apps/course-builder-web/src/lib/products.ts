import { z } from 'zod'

import {
	Coupon,
	priceSchema,
	Product,
	Purchase,
} from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

export const ProductContentSchema = ContentResourceSchema.merge(
	z.object({
		price: priceSchema.nullable().optional(),
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			quantityAvailable: z.number().int().default(-1),
			unitAmount: z.number().min(1).default(1),
			type: z.enum(['live', 'self-paced']),
		}),
	}),
)

export type ProductContent = z.infer<typeof ProductContentSchema>
