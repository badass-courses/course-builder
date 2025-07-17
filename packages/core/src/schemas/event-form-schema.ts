import { z } from 'zod'

import type { ContentResource } from './content-resource-schema'

export type EventCreationResult = {
	type: 'single' | 'series'
	event?: ContentResource
	eventSeries?: ContentResource
	childEvents?: ContentResource[]
}

export type CreateEventFormProps = {
	onSuccess: (result: EventCreationResult) => Promise<void>
	createEvent: (
		data: Omit<SingleEventForm, 'createdById' | 'organizationId'>,
	) => Promise<ContentResource>
	createEventSeries: (
		data: Omit<EventSeriesForm, 'createdById' | 'organizationId'>,
	) => Promise<{
		eventSeries: ContentResource
		childEvents: ContentResource[]
	}>
	tags?: {
		id: string
		fields: {
			label: string
			name: string
		}
	}[]
	allowMultipleEvents?: boolean
	allowCoupons?: boolean
	defaultTimezone?: string
	defaultPrice?: number
	defaultQuantity?: number
}

/**
 * Schema for creating multiple events with shared product configuration
 * Each event has its own title, dates, and tags, but they share price and quantity
 * When multiple events are created, an event series is created to contain them
 */
export const MultipleEventsFormSchema = z
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
		coupon: z.object({
			enabled: z.boolean().default(false),
			percentageDiscount: z
				.enum(['1', '0.95', '0.9', '0.75', '0.6', '0.5', '0.4', '0.25', '0.1'])
				.optional(),
			expires: z.date().optional(),
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
			path: ['eventSeries', 'title'],
		},
	)
	.refine(
		(data) => {
			// Require coupon fields when coupon is enabled
			if (data.coupon.enabled) {
				if (!data.coupon.percentageDiscount) {
					return false
				}
				if (!data.coupon.expires) {
					return false
				}
			}
			return true
		},
		{
			message:
				'Percentage discount and expiration date are required when coupon is enabled',
			path: ['coupon'],
		},
	)

export type MultipleEventsForm = z.infer<typeof MultipleEventsFormSchema>

/**
 * Schema for adapter-level single event creation
 * Includes database fields required by the adapter
 */
export const SingleEventFormSchema = z.object({
	type: z.literal('event'),
	fields: z.object({
		title: z.string().min(2).max(90),
		startsAt: z.date().nullish(),
		endsAt: z.date().nullish(),
		description: z.string().optional(),
		price: z.number().min(0).nullish(),
		quantity: z.number().min(-1).nullish(),
		state: z.string().optional(),
		visibility: z.string().optional(),
		slug: z.string().optional(),
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
	createdById: z.string(),
	organizationId: z.string().nullish(),
	coupon: z
		.object({
			enabled: z.boolean(),
			percentageDiscount: z.string().optional(),
			expires: z.date().optional(),
		})
		.optional(),
})

export type SingleEventForm = z.infer<typeof SingleEventFormSchema>

/**
 * Schema for adapter-level event series creation
 * Includes database fields required by the adapter
 */
export const EventSeriesFormSchema = z.object({
	type: z.literal('event-series'),
	eventSeries: z.object({
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
	sharedFields: z.object({
		price: z.number().min(0).nullish(),
		quantity: z.number().min(-1).nullish(),
	}),
	childEvents: z
		.array(
			z.object({
				type: z.literal('event'),
				fields: z.object({
					title: z.string().min(2).max(90),
					startsAt: z.date().nullish(),
					endsAt: z.date().nullish(),
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
			}),
		)
		.min(1),
	createdById: z.string(),
	organizationId: z.string().nullish(),
	coupon: z
		.object({
			enabled: z.boolean(),
			percentageDiscount: z.string().optional(),
			expires: z.date().optional(),
		})
		.optional(),
})

export type EventSeriesForm = z.infer<typeof EventSeriesFormSchema>
