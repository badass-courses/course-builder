import { z } from 'zod'

export {
	EventSchema,
	EventSeriesSchema,
	MultipleEventsFormSchema,
	EventFieldsSchema,
	multipleEventsToEventSeriesAndEvents,
	NewEventSchema,
	NewEventSeriesSchema,
	type NewEvent,
	type NewEventSeries,
	type Event,
	type EventSeriesForm,
	type SingleEventForm,
} from '@coursebuilder/core'
