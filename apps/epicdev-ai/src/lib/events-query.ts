'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag,
} from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	EventSchema,
	EventSeriesDomainSchema as EventSeriesSchema,
	type Event,
	type EventSeriesData,
	type SingleEventData,
} from '@coursebuilder/core'

import {
	RESOURCE_CREATED_EVENT,
	RESOURCE_UPDATED_EVENT,
} from '../inngest/events/resource-management'
import { inngest } from '../inngest/inngest.server'
import { createCoupon, type CouponInput } from './coupons-query'
import { getMinimalProductInfoWithoutUser } from './posts-query'
import {
	addResourceToProduct,
	createProduct,
	getProduct,
} from './products-query'
import { upsertPostToTypeSense } from './typesense-query'

export async function getEvent(eventIdOrSlug: string) {
	const eventData = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.type, 'event'),
			or(
				eq(contentResource.id, eventIdOrSlug),
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					eventIdOrSlug,
				),
			),
		),
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

	const parsedEvent = EventSchema.safeParse(eventData)
	if (!parsedEvent.success) {
		console.error('Error parsing event', eventData)
		return null
	}

	return parsedEvent.data
}

export async function getEventOrEventSeries(eventIdOrSlug: string) {
	const eventData = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(contentResource.type, 'event'),
				eq(contentResource.type, 'event-series'),
			),
			or(
				eq(contentResource.id, eventIdOrSlug),
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					eventIdOrSlug,
				),
			),
		),
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
	const eventSeriesData = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.type, 'event-series'),
			or(
				eq(contentResource.id, eventSeriesIdOrSlug),
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					eventSeriesIdOrSlug,
				),
			),
		),
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
		await log.error('event.update.notfound', {
			eventId: input.id,
			userId: user?.id,
			action,
		})
		throw new Error(`Event with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentEvent))) {
		await log.error('event.update.unauthorized', {
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
		await log.info('event.update.slug.changed', {
			eventId: input.id,
			oldSlug: currentEvent.fields.slug,
			newSlug: eventSlug,
			userId: user.id,
		})
	} else if (input?.fields?.slug !== currentEvent.fields.slug) {
		eventSlug = input?.fields?.slug || ''
		await log.info('event.update.slug.manual', {
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
			},
			action,
		)
		await log.info('event.update.typesense.success', {
			eventId: input.id,
			action,
			userId: user.id,
		})
		console.log('🔍 Event updated in Typesense')
	} catch (error) {
		await log.error('event.update.typesense.failed', {
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

		await log.info('event.update.success', {
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
		await log.error('event.update.failed', {
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
 * Retrieves a list of event and event-like post IDs that are either past or sold out.
 * This is used to filter these items from search results or recommendations.
 * It checks:
 *  - `fields.endsAt` to determine if an event has concluded.
 *  - `fields.startsAt` (if `endsAt` is not present) for past all-day or multi-day events.
 *  - Product availability via `getProductForPost` to identify sold-out events.
 * @returns {Promise<string[]>} A promise that resolves to an array of excluded event/post IDs.
 */
export async function getPastEventIds(): Promise<string[]> {
	const actualEvents = await getAllEvents()

	const postsAsEvents = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			// eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.postType")`, 'event'),
		),
	})

	const allEventLikeItems = [...actualEvents, ...postsAsEvents]
	const excludedEventIds: string[] = []
	const now = new Date()

	for (const item of allEventLikeItems) {
		// Ensure fields is not null, which it shouldn't be based on schema defaults
		const fields = item.fields || {}
		if (fields.endsAt && new Date(fields.endsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}

		// If there's no endsAt, check startsAt for past events (e.g., all-day events that have passed)
		if (!fields.endsAt && fields.startsAt && new Date(fields.startsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}
	}

	return excludedEventIds
}

/**
 * Retrieves a list of event and event-like post IDs that are either past or sold out.
 * This is used to filter these items from search results or recommendations.
 * It checks:
 *  - `fields.endsAt` to determine if an event has concluded.
 *  - `fields.startsAt` (if `endsAt` is not present) for past all-day or multi-day events.
 *  - Product availability via `getProductForPost` to identify sold-out events.
 * @returns {Promise<string[]>} A promise that resolves to an array of excluded event/post IDs.
 */
export async function getSoldOutOrPastEventIds(): Promise<string[]> {
	const actualEvents = await getAllEvents()

	const postsAsEvents = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			// eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.postType")`, 'event'),
		),
	})

	const allEventLikeItems = [...actualEvents, ...postsAsEvents]
	const excludedEventIds: string[] = []
	const now = new Date()

	for (const item of allEventLikeItems) {
		// Ensure fields is not null, which it shouldn't be based on schema defaults
		const fields = item.fields || {}
		if (fields.endsAt && new Date(fields.endsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}

		// If there's no endsAt, check startsAt for past events (e.g., all-day events that have passed)
		if (!fields.endsAt && fields.startsAt && new Date(fields.startsAt) < now) {
			excludedEventIds.push(item.id)
			continue
		}

		const productInfo = await getMinimalProductInfoWithoutUser(item.id)

		// we can sell more seats than we have available via coupons or team seats,
		// so we need to check if the total quantity is -1 (which means unlimited)
		if (
			productInfo &&
			productInfo.quantityAvailable <= 0 &&
			productInfo.totalQuantity !== -1
		) {
			excludedEventIds.push(item.id)
		}
	}

	return excludedEventIds
}

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
 * App-specific wrapper for creating events with all business logic preserved
 * Calls adapter for database operations, then handles all app-specific side effects
 */
export async function createEventWithAppLogic(
	input: Omit<SingleEventData, 'createdById' | 'organizationId'>,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Step 1: Call adapter for pure database operations
	const eventResource = await courseBuilderAdapter.createEvent({
		type: input.type,
		fields: input.fields,
		createdById: user.id,
	})

	// Parse the ContentResource to Event domain type
	const parsedEvent = EventSchema.safeParse(eventResource)
	if (!parsedEvent.success) {
		console.error('Error parsing created event', eventResource)
		throw new Error('Error parsing created event')
	}
	const event = parsedEvent.data

	// Step 2: ALL the existing side effects (preserved exactly)

	// Product creation (preserved exactly)
	if (input.fields.price && input.fields.price > 0) {
		try {
			const product = await createProduct({
				name: input.fields.title,
				price: input.fields.price,
				quantityAvailable: input.fields.quantity ?? -1,
				type: 'live',
				state: 'published',
				visibility: 'public',
			})

			if (product) {
				await addResourceToProduct({
					resource: event,
					productId: product.id,
				})

				// Coupon creation (preserved exactly with all date logic)
				if (
					input.coupon?.enabled &&
					input.coupon.percentageDiscount &&
					input.coupon.expires
				) {
					try {
						let finalExpires = input.coupon.expires
						if (finalExpires instanceof Date) {
							finalExpires = new Date(
								Date.UTC(
									finalExpires.getUTCFullYear(),
									finalExpires.getUTCMonth(),
									finalExpires.getUTCDate(),
									23,
									59,
									59,
									0,
								),
							)
						}
						const couponInput: CouponInput = {
							quantity: '1',
							maxUses: -1,
							expires: finalExpires,
							restrictedToProductId: product.id,
							percentageDiscount: input.coupon.percentageDiscount,
							status: 1,
							default: true,
							fields: { bypassSoldOut: false },
						}
						await createCoupon(couponInput)

						// Logging (preserved exactly)
						await log.info('event.create.coupon.success', {
							eventId: event.id,
							productId: product.id,
							userId: user.id,
							percentageDiscount: input.coupon.percentageDiscount,
						})
					} catch (couponError) {
						// Error logging (preserved exactly)
						await log.error('event.create.coupon.failed', {
							eventId: event.id,
							productId: product.id,
							userId: user.id,
							error: getErrorMessage(couponError),
							stack: getErrorStack(couponError),
						})
					}
				}
			}
		} catch (error) {
			console.error('Error creating and associating product', error)
		}
	}

	// Tag association (preserved exactly)
	if (input.fields.tagIds) {
		try {
			await db.insert(contentResourceTag).values(
				input.fields.tagIds.map((tag) => ({
					contentResourceId: event.id,
					tagId: tag.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					position: 0,
				})),
			)
		} catch (error) {
			await log.error('event.create.tags.failed', {
				eventId: event.id,
				userId: user.id,
				tagIds: input.fields.tagIds,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
		}
	}

	// Inngest dispatch (preserved exactly)
	try {
		console.log(
			`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${event.id}`,
		)
		await inngest.send({
			name: RESOURCE_CREATED_EVENT,
			data: { id: event.id, type: event.type },
		})
	} catch (error) {
		console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
	}

	// Typesense indexing (preserved exactly)
	await upsertPostToTypeSense(event, 'save')

	return event
}

/**
 * App-specific wrapper for creating event series with all business logic preserved
 * Calls adapter for database operations, then handles all app-specific side effects
 */
export async function createEventSeriesWithAppLogic(
	input: Omit<EventSeriesData, 'createdById' | 'organizationId'>,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	// Step 1: Call adapter for database operations
	const result = await courseBuilderAdapter.createEventSeries({
		type: input.type as 'event-series',
		eventSeries: input.eventSeries,
		sharedFields: input.sharedFields,
		createdById: user.id,
		childEvents: input.childEvents.map((event) => ({
			type: 'event' as const,
			fields: {
				title: event.fields.title,
				startsAt: event.fields.startsAt,
				endsAt: event.fields.endsAt,
				description: event.fields.description,
			},
		})),
	})

	// Step 2: Handle all app-specific business logic (preserved exactly from original)

	// Product creation for series (preserved exactly)
	if (input.sharedFields.price && input.sharedFields.price > 0) {
		try {
			const product = await createProduct({
				name: input.eventSeries.title,
				price: input.sharedFields.price,
				quantityAvailable: input.sharedFields.quantity ?? -1,
				type: 'live',
				state: 'published',
				visibility: 'public',
			})

			if (product) {
				await addResourceToProduct({
					resource: result.eventSeries,
					productId: product.id,
				})

				// Coupon creation for series (preserved exactly)
				if (
					input.coupon?.enabled &&
					input.coupon.percentageDiscount &&
					input.coupon.expires
				) {
					try {
						let finalExpires = input.coupon.expires
						if (finalExpires instanceof Date) {
							finalExpires = new Date(
								Date.UTC(
									finalExpires.getUTCFullYear(),
									finalExpires.getUTCMonth(),
									finalExpires.getUTCDate(),
									23,
									59,
									59,
									0,
								),
							)
						}
						const couponInput: CouponInput = {
							quantity: '1',
							maxUses: -1,
							expires: finalExpires,
							restrictedToProductId: product.id,
							percentageDiscount: input.coupon.percentageDiscount,
							status: 1,
							default: true,
							fields: { bypassSoldOut: false },
						}
						await createCoupon(couponInput)

						await log.info('event.series.create.coupon.success', {
							eventSeriesId: result.eventSeries.id,
							productId: product.id,
							userId: user.id,
							percentageDiscount: input.coupon.percentageDiscount,
						})
					} catch (couponError) {
						await log.error('event.series.create.coupon.failed', {
							eventSeriesId: result.eventSeries.id,
							productId: product.id,
							userId: user.id,
							error: getErrorMessage(couponError),
							stack: getErrorStack(couponError),
						})
					}
				}
			}
		} catch (error) {
			await log.error('event.series.product.creation.failed', {
				eventSeriesId: result.eventSeries.id,
				userId: user.id,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
		}
	}

	// Tag association for event series
	if (input.eventSeries.tagIds) {
		try {
			await db.insert(contentResourceTag).values(
				input.eventSeries.tagIds.map((tag) => ({
					contentResourceId: result.eventSeries.id,
					tagId: tag.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					position: 0,
				})),
			)
		} catch (error) {
			await log.error('event.series.tags.failed', {
				eventSeriesId: result.eventSeries.id,
				userId: user.id,
				tagIds: input.eventSeries.tagIds,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
		}
	}

	// Tag association for child events
	for (let i = 0; i < input.childEvents.length; i++) {
		const childEvent = input.childEvents[i]
		const createdChildEvent = result.childEvents[i]

		if (childEvent?.fields.tagIds && createdChildEvent) {
			try {
				await db.insert(contentResourceTag).values(
					childEvent.fields.tagIds.map((tag) => ({
						contentResourceId: createdChildEvent.id,
						tagId: tag.id,
						createdAt: new Date(),
						updatedAt: new Date(),
						position: 0,
					})),
				)
			} catch (error) {
				await log.error('event.child.tags.failed', {
					childEventId: createdChildEvent.id,
					userId: user.id,
					tagIds: childEvent.fields.tagIds,
					error: getErrorMessage(error),
					stack: getErrorStack(error),
				})
			}
		}
	}

	// Inngest dispatch for event series and child events
	try {
		console.log(
			`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${result.eventSeries.id}`,
		)
		await inngest.send({
			name: RESOURCE_CREATED_EVENT,
			data: { id: result.eventSeries.id, type: result.eventSeries.type },
		})

		for (const childEvent of result.childEvents) {
			console.log(
				`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${childEvent.id}`,
			)
			await inngest.send({
				name: RESOURCE_CREATED_EVENT,
				data: { id: childEvent.id, type: childEvent.type },
			})
		}
	} catch (error) {
		console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
	}

	// Typesense indexing for event series and child events
	try {
		await upsertPostToTypeSense(result.eventSeries, 'save')
		for (const childEvent of result.childEvents) {
			await upsertPostToTypeSense(childEvent, 'save')
		}
	} catch (error) {
		await log.error('event.series.typesense.failed', {
			eventSeriesId: result.eventSeries.id,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
		})
	}

	return result
}
