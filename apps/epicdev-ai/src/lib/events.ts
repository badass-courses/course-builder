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
		description: z.string().optional(),
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

export const EventSeriesSchema = ContentResourceSchema.merge(
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
			slug: z.string(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			image: z.string().optional(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
			thumbnailTime: z.number().nullish(),
			attendeeInstructions: z.string().nullable().optional(),
		}),
	}),
)

export type EventSeries = z.infer<typeof EventSeriesSchema>

export const NewEventSeriesSchema = z.object({
	type: z.literal('event-series').default('event-series'),
	fields: z.object({
		title: z.string().min(2).max(90),
		description: z.string().optional(),
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

export type NewEventSeries = z.infer<typeof NewEventSeriesSchema>

/**
 * Schema for creating multiple events with shared product configuration
 * Each event has its own title, dates, and tags, but they share price and quantity
 * When multiple events are created, an event series is created to contain them
 */
export const MultipleEventsSchema = z
	.object({
		type: z.enum(['event', 'event-series']).default('event'),
		eventSeries: z.object({
			title: z.string().max(90).default(''),
			description: z.string().optional(),
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
		sharedFields: z.object({
			price: z.number().min(0).nullish(),
			quantity: z.number().min(-1).nullish(),
		}),
		events: z
			.array(
				z.object({
					title: z.string().min(2).max(90),
					startsAt: z.date().nullish(),
					endsAt: z.date().nullish(),
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
						.nullish(), // Tags are per-event, not shared
				}),
			)
			.min(1),
	})
	.refine(
		(data) => {
			// Require series title if more than one event
			if (data.events.length > 1 && data.eventSeries.title.trim().length < 2) {
				return false
			}
			return true
		},
		{
			message:
				'Series title must be at least 2 characters when creating multiple events',
			path: ['event-series', 'title'],
		},
	)

export type MultipleEvents = z.infer<typeof MultipleEventsSchema>

/**
 *
 */
export type ChildEvent = {
	type: 'event'
	fields: {
		title: string
		startsAt: Date | null | undefined
		endsAt: Date | null | undefined
		description?: string | undefined
		tagIds?:
			| { id: string; fields: { label: string; name: string } }[]
			| null
			| undefined
	}
}

/**
 * Convert MultipleEvents to event series and child events for the new pattern
 * The event series contains the product information and acts as a container
 * Child events contain individual event details without pricing
 */
export function multipleEventsToEventSeriesAndEvents(input: MultipleEvents): {
	eventSeries: NewEventSeries & {
		sharedFields: {
			price: number | null | undefined
			quantity: number | null | undefined
		}
	}
	childEvents: ChildEvent[]
} {
	const eventSeries = {
		type: 'event-series' as const,
		fields: {
			title: input.eventSeries.title,
			description: input.eventSeries.description,
			tagIds: input.eventSeries.tagIds,
		},
		sharedFields: {
			price: input.sharedFields.price,
			quantity: input.sharedFields.quantity,
		},
	}

	const childEvents: ChildEvent[] = input.events.map((event) => ({
		type: 'event' as const,
		fields: {
			title: event.title,
			startsAt: event.startsAt,
			endsAt: event.endsAt,
			tagIds: event.tagIds,
			// No price/quantity for child events - they're contained in the event series
		},
	}))

	return { eventSeries, childEvents }
}
