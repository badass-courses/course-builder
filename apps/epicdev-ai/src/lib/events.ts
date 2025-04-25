import { z } from 'zod'

import { productSchema } from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'

import { PostTagsSchema } from './posts'

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
			startsAt: z.string().datetime().nullable().optional(),
			endsAt: z.string().datetime().nullable().optional(),
			timezone: z.string().default('America/Los_Angeles'),
			image: z.string().optional(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
			calendarId: z.string().optional(),
			thumbnailTime: z.number().nullish(),
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
	}),
})

export type NewEvent = z.infer<typeof NewEventSchema>
