import { z } from 'zod'

import { productSchema } from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

import { FeaturedSchema, PostTagsSchema } from './posts'

export const EventFieldsSchema = z.object({
	startsAt: z.string().datetime().nullable().optional(),
	endsAt: z.string().datetime().nullable().optional(),
	timezone: z.string().default('America/Los_Angeles').nullish(),
	attendeeInstructions: z.string().nullable().optional(),
})

/**
 * @description Schema for time-bound events like workshops, webinars, and live sessions
 */
export const EventSchema = ContentResourceSchema.merge(
	z.object({
		videoResourceId: z.string().optional().nullable(),
		resourceProducts: z
			.array(
				z.object({
					resourceId: z.string(),
					productId: z.string(),
					product: productSchema,
				}),
			)
			.default([]),
		tags: PostTagsSchema,
		fields: z.object({
			body: z.string().nullable().optional(),
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			details: z.string().optional(),
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			...EventFieldsSchema.shape,
			image: z.string().optional(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
			calendarId: z.string().optional(),
			thumbnailTime: z.number().nullish(),
			featured: FeaturedSchema.optional(),
		}),
	}),
)

export type Event = z.infer<typeof EventSchema>

export const NewEventSchema = z.object({
	type: z.literal('event').default('event'),
	fields: z.object({
		title: z.string().min(2).max(90),
		startsAt: z.date().nullish(),
		endsAt: z.date().nullish(),
		price: z.number().min(0).nullish(),
		quantity: z.number().min(-1).nullish(),
		tagIds: z
			.array(
				z.object({
					id: z.string(),
					fields: z.object({
						label: z.string(),
						name: z.string(),
					}),
				}),
			)
			.nullish(),
	}),
})

export type NewEvent = z.infer<typeof NewEventSchema>
