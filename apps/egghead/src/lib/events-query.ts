'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag,
} from '@/db/schema'
import {
	EventSchema,
	EventSeriesSchema,
	multipleEventsToEventSeriesAndEvents,
	type Event,
	type EventFormData,
	type EventSeries,
	type EventSeriesFormData,
} from '@/lib/events'
import { upsertPostToTypeSense } from '@/lib/typesense/post'
import { logger as log } from '@/lib/utils/logger'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	RESOURCE_CREATED_EVENT,
	RESOURCE_UPDATED_EVENT,
} from '../inngest/events/resource-management'
import { inngest } from '../inngest/inngest.server'

/**
 * @description Get a single event by ID or slug
 */
export async function getEvent(eventIdOrSlug: string) {
	const eventData = await courseBuilderAdapter.getEvent(eventIdOrSlug, {
		withResources: true,
		withTags: true,
		withProducts: true,
		withPricing: true,
	})

	const parsedEvent = EventSchema.safeParse(eventData)
	if (!parsedEvent.success) {
		console.error('Error parsing event', eventData)
		return null
	}

	return parsedEvent.data
}

/**
 * @description Get cached event or event series
 */
export const getCachedEventOrEventSeries = unstable_cache(
	async (eventIdOrSlug: string) => {
		return await getEventOrEventSeries(eventIdOrSlug)
	},
	['events'],
	{ revalidate: 3600, tags: ['events'] },
)

/**
 * @description Get an event or event series by ID or slug
 */
export async function getEventOrEventSeries(eventIdOrSlug: string) {
	const eventData = await courseBuilderAdapter.getEvent(eventIdOrSlug, {
		withResources: true,
		withTags: true,
		withProducts: true,
		withPricing: true,
	})

	let parsedEvent
	if (eventData?.type === 'event') {
		parsedEvent = EventSchema.safeParse(eventData)
	} else if (eventData?.type === 'event-series') {
		parsedEvent = EventSeriesSchema.safeParse(eventData)
	} else {
		console.error('Error parsing event', eventData)
		return null
	}
	if (!parsedEvent.success) {
		console.error('Error parsing event', eventData)
		return null
	}

	return parsedEvent.data
}

/**
 * @description Get all events
 */
export async function getAllEvents() {
	const events = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'event'),
	})

	const parsedEvents = z.array(EventSchema).safeParse(events)

	if (!parsedEvents.success) {
		console.error('Error parsing events', events)
		return []
	}

	return parsedEvents.data
}

/**
 * @description Get an event series by ID or slug
 */
export async function getEventSeries(eventSeriesIdOrSlug: string) {
	const eventSeriesData = await courseBuilderAdapter.getEvent(
		eventSeriesIdOrSlug,
		{
			withResources: true,
			withTags: true,
			withProducts: true,
			withPricing: true,
		},
	)

	const parsedEventSeries = EventSeriesSchema.safeParse(eventSeriesData)
	if (!parsedEventSeries.success) {
		console.error('Error parsing event series', eventSeriesData)
		return null
	}

	return parsedEventSeries.data
}

/**
 * @description Update an event
 */
export async function updateEvent(
	input: Partial<Event>,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
	revalidate = true,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!input.id) {
		throw new Error('Event id is required')
	}

	const currentEvent = await getEventOrEventSeries(input.id)

	if (!currentEvent) {
		log.error('event.update.notfound', {
			eventId: input.id,
			userId: user?.id,
			action,
		})
		throw new Error(`Event with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentEvent))) {
		log.error('event.update.unauthorized', {
			eventId: input.id,
			userId: user?.id,
			action,
		})
		throw new Error('Unauthorized')
	}

	let eventSlug = currentEvent.fields.slug

	if (
		input.fields?.title !== currentEvent.fields.title &&
		input.fields?.slug?.includes('~')
	) {
		const splitSlug = currentEvent.fields.slug.split('~') || ['', guid()]
		eventSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
		log.info('event.update.slug.changed', {
			eventId: input.id,
			oldSlug: currentEvent.fields.slug,
			newSlug: eventSlug,
			userId: user.id,
		})
	} else if (input?.fields?.slug !== currentEvent.fields.slug) {
		eventSlug = input?.fields?.slug || ''
		log.info('event.update.slug.manual', {
			eventId: input.id,
			oldSlug: currentEvent.fields.slug,
			newSlug: eventSlug,
			userId: user.id,
		})
	}

	try {
		await upsertPostToTypeSense(
			{
				...currentEvent,
				resources: [],
				fields: {
					...currentEvent.fields,
					...input.fields,
					description: input.fields?.description || '',
					slug: eventSlug,
				},
			} as any,
			action,
		)
		log.info('event.update.typesense.success', {
			eventId: input.id,
			action,
			userId: user.id,
		})
		console.log('🔍 Event updated in Typesense')
	} catch (error) {
		log.error('event.update.typesense.failed', {
			eventId: input.id,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			action,
			userId: user.id,
		})
		console.log('❌ Error updating event in Typesense', error)
	}

	try {
		const updatedEvent = await courseBuilderAdapter.updateContentResourceFields(
			{
				id: currentEvent.id,
				fields: {
					...currentEvent.fields,
					...input.fields,
					slug: eventSlug,
				},
			},
		)

		if (!updatedEvent) {
			console.error(`Failed to fetch updated event: ${currentEvent.id}`)
			return null
		}

		log.info('event.update.success', {
			eventId: input.id,
			action,
			userId: user.id,
			changes: Object.keys(input.fields || {}),
		})

		revalidate && revalidateTag('events')
		try {
			console.log(
				`Dispatching ${RESOURCE_UPDATED_EVENT} for resource: ${updatedEvent.id} (type: ${updatedEvent.type})`,
			)
			const result = await inngest.send({
				name: RESOURCE_UPDATED_EVENT,
				data: {
					id: updatedEvent.id,
					type: updatedEvent.type,
				},
			})
			console.log(
				`Dispatched ${RESOURCE_UPDATED_EVENT} for resource: ${updatedEvent.id} (type: ${updatedEvent.type})`,
				result,
			)
		} catch (error) {
			console.error(`Error dispatching ${RESOURCE_UPDATED_EVENT}`, error)
		}
		return updatedEvent
	} catch (error) {
		log.error('event.update.failed', {
			eventId: input.id,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			action,
			userId: user.id,
		})
		throw error
	}
}

/**
 * @description Get active events (not past or sold out)
 */
export async function getActiveEvents() {
	const excludedEventIds = await getSoldOutOrPastEventIds()

	const events = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'event'),
			excludedEventIds.length > 0
				? sql`${contentResource.id} NOT IN ${excludedEventIds}`
				: undefined,
		),
		orderBy: asc(sql`JSON_EXTRACT (${contentResource.fields}, "$.startsAt")`),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTag.position),
			},
			resourceProducts: {
				with: {
					product: {
						with: {
							price: true,
						},
					},
				},
			},
		},
	})

	const parsedEvents = z.array(EventSchema).safeParse(events)

	if (!parsedEvents.success) {
		console.error('Error parsing active events', events)
		return []
	}

	return parsedEvents.data
}

/**
 * @description Create a new event
 */
export async function createEvent(input: EventFormData) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}
	const event = await courseBuilderAdapter.createEvent(input, user.id)

	if (!event) {
		throw new Error('Failed to create event')
	}

	try {
		console.log(
			`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${event.id} (type: ${event.type})`,
		)
		await inngest.send({
			name: RESOURCE_CREATED_EVENT,
			data: {
				id: event.id,
				type: event.type,
			},
		})
	} catch (error) {
		console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
	}

	await upsertPostToTypeSense(event as any, 'save')
	return event
}

/**
 * @description Create an event series with multiple child events
 */
export async function createEventSeries(input: EventSeriesFormData) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	if (input.childEvents.length === 0) {
		throw new Error('At least one event is required')
	}

	const { eventSeries: eventSeriesInput, childEvents: childEventsInput } =
		multipleEventsToEventSeriesAndEvents(input)

	try {
		// Create event series and child events using the adapter
		const result = await courseBuilderAdapter.createEventSeries(
			{
				eventSeries: eventSeriesInput,
				childEvents: childEventsInput,
				coupon: input.coupon,
			},
			user.id,
		)

		const { eventSeries, childEvents } = result

		// Handle external service calls
		try {
			// Send Inngest events for the event series
			console.log(
				`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${eventSeries.id} (type: ${eventSeries.type})`,
			)
			await inngest.send({
				name: RESOURCE_CREATED_EVENT,
				data: {
					id: eventSeries.id,
					type: eventSeries.type,
				},
			})

			// Send Inngest events for each child event
			for (const childEvent of childEvents) {
				console.log(
					`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${childEvent.id} (type: ${childEvent.type})`,
				)
				await inngest.send({
					name: RESOURCE_CREATED_EVENT,
					data: {
						id: childEvent.id,
						type: childEvent.type,
					},
				})
			}
		} catch (error) {
			log.error('event.series.inngest.failed', {
				eventSeriesId: eventSeries.id,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
			console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
		}

		// Update TypeSense
		try {
			await upsertPostToTypeSense(eventSeries as any, 'save')
			for (const childEvent of childEvents) {
				await upsertPostToTypeSense(childEvent as any, 'save')
			}
		} catch (error) {
			log.error('event.series.typesense.failed', {
				eventSeriesId: eventSeries.id,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
			console.error('Error updating TypeSense', error)
		}

		// Logging for successful creation
		log.info('event.series.created', {
			eventSeriesId: eventSeries.id,
			userId: user.id,
			childEventCount: childEvents.length,
		})

		for (let i = 0; i < childEvents.length; i++) {
			log.info('event.series.child.created', {
				childEventId: childEvents[i]!.id,
				eventSeriesId: eventSeries.id,
				position: i,
				userId: user.id,
			})
		}

		log.info('event.series.completed', {
			eventSeriesId: eventSeries.id,
			childEventIds: childEvents.map((e) => e.id),
			userId: user.id,
		})

		return { eventSeries, childEvents }
	} catch (error) {
		log.error('event.series.creation.failed', {
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			userId: user.id,
			eventCount: input.childEvents.length,
		})
		throw error
	}
}

/**
 * @description Get list of past event IDs
 */
export async function getPastEventIds(): Promise<string[]> {
	const actualEvents = await getAllEvents()
	const excludedEventIds: string[] = []
	const now = new Date()

	for (const item of actualEvents) {
		const fields = item.fields || {}
		if (fields.endsAt && new Date(fields.endsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}

		// If there's no endsAt, check startsAt for past events
		if (!fields.endsAt && fields.startsAt && new Date(fields.startsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}
	}

	return excludedEventIds
}

/**
 * @description Get list of sold out or past event IDs
 */
export async function getSoldOutOrPastEventIds(): Promise<string[]> {
	const actualEvents = await getAllEvents()
	const excludedEventIds: string[] = []
	const now = new Date()

	for (const item of actualEvents) {
		const fields = item.fields || {}
		if (fields.endsAt && new Date(fields.endsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}

		// If there's no endsAt, check startsAt for past events
		if (!fields.endsAt && fields.startsAt && new Date(fields.startsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}

		// TODO: Add product availability check when we have product integration
		// const productInfo = await getMinimalProductInfoWithoutUser(item.id)
		// if (productInfo && productInfo.quantityAvailable <= 0 && productInfo.totalQuantity !== -1) {
		//   excludedEventIds.push(item.id)
		// }
	}

	return excludedEventIds
}

// Utility functions
function getErrorMessage(error: unknown) {
	if (isErrorWithMessage(error)) return error.message
	return String(error)
}

function getErrorStack(error: unknown) {
	if (isErrorWithStack(error)) return error.stack
	return undefined
}

function isErrorWithMessage(error: unknown): error is { message: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: string }).message === 'string'
	)
}

function isErrorWithStack(error: unknown): error is { stack: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'stack' in error &&
		typeof (error as { stack: string }).stack === 'string'
	)
}
