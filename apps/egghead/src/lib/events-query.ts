'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	contentResourceTag,
	purchases,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
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
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

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

export const getCachedEventOrEventSeries = unstable_cache(
	async (eventIdOrSlug: string) => {
		return await getEventOrEventSeries(eventIdOrSlug)
	},
	['events'],
	{ revalidate: 3600, tags: ['events'] },
)

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
		console.error('Event not found', input.id)
		throw new Error(`Event with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentEvent))) {
		console.error('Unauthorized to update event', input.id, user?.id)
		throw new Error('Unauthorized')
	}

	let eventSlug = currentEvent.fields.slug

	if (
		input.fields?.title !== currentEvent.fields.title &&
		input.fields?.slug?.includes('~')
	) {
		const splitSlug = currentEvent.fields.slug.split('~') || ['', guid()]
		eventSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
		console.log('Event slug changed', {
			old: currentEvent.fields.slug,
			new: eventSlug,
		})
	} else if (input?.fields?.slug !== currentEvent.fields.slug) {
		eventSlug = input?.fields?.slug || ''
		console.log('Event slug manually changed', {
			old: currentEvent.fields.slug,
			new: eventSlug,
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
			},
			action,
		)
		console.log('🔍 Event updated in Typesense')
	} catch (error) {
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

		console.log('Event updated successfully', input.id)

		revalidate && revalidateTag('events')

		return updatedEvent
	} catch (error) {
		console.error('Failed to update event', error)
		throw error
	}
}

/**
 * Retrieves a list of event IDs that are past based on their end date
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
 * Retrieves a list of event IDs that are either past or sold out
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

		// Check for sold out events
		const productData = await db.query.contentResourceProduct.findFirst({
			where: eq(contentResourceProduct.resourceId, item.id),
			with: {
				product: {
					with: {
						purchases: {
							where: eq(purchases.status, 'Valid'),
						},
					},
				},
			},
		})

		if (productData?.product) {
			const quantity = productData.product.quantityAvailable
			const purchaseCount = productData.product.purchases?.length || 0

			// Check if sold out
			if (quantity !== null && quantity !== -1 && purchaseCount >= quantity) {
				excludedEventIds.push(item.id)
			}
		}
	}

	return excludedEventIds
}

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

	//await upsertPostToTypeSense(event, 'save')
	revalidateTag('events')

	return event
}

/**
 * Create an event series with multiple child events
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

		// Update TypeSense
		try {
			await upsertPostToTypeSense(eventSeries, 'save')
			for (const childEvent of childEvents) {
				await upsertPostToTypeSense(childEvent, 'save')
			}
		} catch (error) {
			console.error('Error updating TypeSense', error)
		}

		console.log('Event series created', {
			eventSeriesId: eventSeries.id,
			childEventCount: childEvents.length,
		})

		revalidateTag('events')

		return { eventSeries, childEvents }
	} catch (error) {
		console.error('Failed to create event series', error)
		throw error
	}
}

/**
 * Get subscribers for an event who purchased the event
 */
export async function getEventPurchasers(
	eventId: string,
): Promise<Array<{ id: string; email: string; name?: string }>> {
	try {
		// First, try to find products associated directly with this event
		let eventProducts = await db.query.contentResourceProduct.findMany({
			where: eq(contentResourceProduct.resourceId, eventId),
			with: {
				product: true,
			},
		})

		// If no products found, check if this event is a child of an event-series
		if (eventProducts.length === 0) {
			const parentEventSeries =
				await db.query.contentResourceResource.findFirst({
					where: eq(contentResourceResource.resourceId, eventId),
					with: {
						resourceOf: true,
					},
				})

			if (parentEventSeries?.resourceOf?.type === 'event-series') {
				console.log(
					'Event is child of event-series, checking parent for products',
				)

				// Get products associated with the parent event-series
				eventProducts = await db.query.contentResourceProduct.findMany({
					where: eq(
						contentResourceProduct.resourceId,
						parentEventSeries.resourceOfId,
					),
					with: {
						product: true,
					},
				})
			}
		}

		if (eventProducts.length === 0) {
			console.log('No products associated with this event')
			return []
		}

		const productIds = eventProducts.map((ep) => ep.productId)

		// Find all purchases of these products
		const eventPurchases = await db.query.purchases.findMany({
			where: and(
				inArray(purchases.productId, productIds),
				eq(purchases.status, 'Valid'),
			),
			with: {
				user: true,
			},
		})

		if (eventPurchases.length === 0) {
			console.log('No purchases found for event products')
			return []
		}

		// Extract unique users
		const uniqueUsers = new Map<
			string,
			{ id: string; email: string; name?: string }
		>()

		for (const purchase of eventPurchases) {
			if (purchase.user && purchase.user.email) {
				uniqueUsers.set(purchase.user.id, {
					id: purchase.user.id,
					email: purchase.user.email,
					name: purchase.user.name || undefined,
				})
			}
		}

		const subscribers = Array.from(uniqueUsers.values())

		console.log('Found event purchasers', {
			eventId,
			productCount: productIds.length,
			purchaseCount: eventPurchases.length,
			uniqueSubscribers: subscribers.length,
		})

		return subscribers
	} catch (error) {
		console.error('Error getting event purchasers', error)
		return []
	}
}
