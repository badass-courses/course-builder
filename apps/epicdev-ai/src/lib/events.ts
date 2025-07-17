import { z } from 'zod'

export {
	EventSchema,
	EventSeriesDomainSchema as EventSeriesSchema,
	MultipleEventsSchema,
	EventFieldsSchema,
	multipleEventsToEventSeriesAndEvents,
	type Event,
	type EventSeriesData,
	type SingleEventData,
} from '@coursebuilder/core'

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
