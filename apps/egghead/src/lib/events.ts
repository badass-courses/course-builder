import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	ContentResourceProductSchema,
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'
import { productSchema } from '@coursebuilder/core/schemas/index'
import type { EventSeriesFormData } from '@coursebuilder/ui/event-creation/create-event-form'

import { EmailSchema } from './emails'

export {
	type EventSeriesFormData,
	type EventFormData,
} from '@coursebuilder/ui/event-creation/create-event-form'

/**
 * @description Event-specific field validation schema
 */
export const EventFieldsSchema = z.object({
	startsAt: z.string().datetime().nullish(),
	endsAt: z.string().datetime().nullish(),
	timezone: z.string().default('America/Los_Angeles').nullish(),
	attendeeInstructions: z.string().nullish(),
})

/**
 * @description Schema for time-bound events like workshops, webinars, and live sessions
 */
export const EventSchema = ContentResourceSchema.merge(
	z.object({
		videoResourceId: z.string().optional().nullable(),
		tags: z.array(z.any()).default([]),
		resourceProducts: z
			.array(ContentResourceProductSchema)
			.default([])
			.nullish(),
		fields: z.object({
			body: z.string().nullish(),
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
			featured: z.boolean().default(false).optional(),
		}),
	}),
)

export type Event = z.infer<typeof EventSchema>

/**
 * @description Schema for event series that contain multiple related events
 */
export const EventSeriesSchema = ContentResourceSchema.merge(
	z.object({
		videoResourceId: z.string().optional().nullable(),
		tags: z.array(z.any()).default([]),
		fields: z.object({
			body: z.string().nullish(),
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
			attendeeInstructions: z.string().nullish(),
		}),
	}),
)

export type EventSeries = z.infer<typeof EventSeriesSchema>

/**
 * @description Schema for creating new events
 */
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

/**
 * @description Schema for creating new event series
 */
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
 * @description Child event type for event series
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
 * @description Convert MultipleEvents UI data to event series and child events
 * The event series contains the product information and acts as a container
 * Child events contain individual event details without pricing
 */
export function multipleEventsToEventSeriesAndEvents(
	input: EventSeriesFormData,
): {
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

	const childEvents: ChildEvent[] = input.childEvents.map((event) => ({
		type: 'event' as const,
		fields: {
			title: event.fields.title,
			startsAt: event.fields.startsAt,
			endsAt: event.fields.endsAt,
			tagIds: event.fields.tagIds,
		},
	}))

	return { eventSeries, childEvents }
}
