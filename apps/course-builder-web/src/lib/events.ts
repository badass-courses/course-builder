import { z } from 'zod'

import { productSchema } from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

export const EventSchema = ContentResourceSchema.merge(
	z.object({
		resourceProducts: z.array(
			z.object({
				resourceId: z.string(),
				productId: z.string(),
				product: productSchema,
			}),
		),
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			startsAt: z.string().datetime().nullable().optional(),
			endsAt: z.string().datetime().nullable().optional(),
			timezone: z.string().default('America/Los_Angeles'),
			image: z.string().url().optional().nullable(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
		}),
	}),
)

export type Event = z.infer<typeof EventSchema>
