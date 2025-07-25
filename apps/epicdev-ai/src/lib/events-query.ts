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
import {
	EventSchema,
	EventSeriesSchema,
	multipleEventsToEventSeriesAndEvents,
	type Event,
	type EventFormData,
	type EventSeries,
	type EventSeriesFormData,
} from '@/lib/events'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
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
import { createCoupon, type CouponInput } from './coupons-query'
import { EmailSchema, type NewEmail } from './emails'
import { createEmail } from './emails-query'
import { getMinimalProductInfoWithoutUser } from './posts-query'
import { addResourceToProduct, createProduct } from './products-query'
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

export const getCachedEventOrEventSeries = unstable_cache(
	async (eventIdOrSlug: string) => {
		return await getEventOrEventSeries(eventIdOrSlug)
	},
	['events'],
	{ revalidate: 3600, tags: ['events'] },
)

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
export async function createEvent(input: EventFormData) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const hash = guid()
	const newResourceId = slugify(`${input.type}~${hash}`)

	const newEvent = {
		id: newResourceId,
		...input,
		type: 'event',
		fields: {
			...input.fields,
			title: input.fields.title,
			state: 'draft',
			visibility: 'public',
			slug: slugify(`${input.fields.title}~${hash}`),
		},
		createdById: user.id,
	}

	await db.insert(contentResource).values(newEvent)

	const resource = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, newResourceId),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
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

	const parsedResource = EventSchema.safeParse(resource)
	if (!parsedResource.success) {
		console.error('Error parsing event resource', resource)
		throw new Error('Error parsing event resource')
	}

	// if we provide a price, we need to create a product and associate it with the event
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
					resource: parsedResource.data,
					productId: product.id,
				})

				// Create coupon if enabled
				if (
					input.coupon?.enabled &&
					input.coupon.percentageDiscount &&
					input.coupon.expires
				) {
					try {
						let finalExpires = input.coupon.expires
						if (finalExpires instanceof Date) {
							// Create a new Date object for 23:59:59 UTC on the date part of finalExpires
							// finalExpires from the form should be a JS Date representing 00:00:00 LA time for the chosen day.
							// Its UTC date parts (getUTCFullYear, etc.) will give us the correct calendar day.
							finalExpires = new Date(
								Date.UTC(
									finalExpires.getUTCFullYear(),
									finalExpires.getUTCMonth(), // 0-indexed
									finalExpires.getUTCDate(),
									23, // hours
									59, // minutes
									59, // seconds
									0, // milliseconds
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
							fields: {
								bypassSoldOut: false,
							},
						}
						await createCoupon(couponInput)
						await log.info('event.create.coupon.success', {
							eventId: newResourceId,
							productId: product.id,
							userId: user.id,
							percentageDiscount: input.coupon.percentageDiscount,
						})
					} catch (couponError) {
						console.error('Error creating coupon for event', couponError)
						await log.error('event.create.coupon.failed', {
							eventId: newResourceId,
							productId: product.id,
							userId: user.id,
							error: getErrorMessage(couponError),
							stack: getErrorStack(couponError),
						})
						// Don't throw here - event creation should succeed even if coupon fails
					}
				}
			} else {
				await log.error('event.create.product.failed', {
					eventId: newResourceId,
					userId: user.id,
					price: input.fields.price,
				})
			}
		} catch (error) {
			console.error('Error creating and associating product', error)
		}
	}

	// if we provide tagIds, we need to associate them with the event
	if (input.fields.tagIds) {
		try {
			await db.insert(contentResourceTag).values(
				input.fields.tagIds.map((tag) => ({
					contentResourceId: newResourceId,
					tagId: tag.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					position: 0,
				})),
			)
		} catch (error) {
			console.error('Error associating tags with event', error)
			await log.error('event.create.tags.failed', {
				eventId: newResourceId,
				userId: user.id,
				tagIds: input.fields.tagIds,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
		}
	}

	try {
		console.log(
			`Dispatching ${RESOURCE_CREATED_EVENT} for resource: ${parsedResource.data.id} (type: ${parsedResource.data.type})`,
		)
		await inngest.send({
			name: RESOURCE_CREATED_EVENT,
			data: {
				id: parsedResource.data.id,
				type: parsedResource.data.type,
			},
		})
	} catch (error) {
		console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
	}

	await upsertPostToTypeSense(parsedResource.data, 'save')
	return parsedResource.data
}

/**
 * Create an event series with multiple child events
 * The event series has the product association and acts as a container
 */
export async function createEventSeries(input: EventSeriesFormData): Promise<{
	eventSeries: EventSeries
	childEvents: Event[]
}> {
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

	let eventSeries: EventSeries
	let childEvents: Event[] = []
	let sharedProduct = null

	try {
		// Execute all database operations within a transaction
		const result = await db.transaction(async (tx) => {
			// Step 1: Create the event series resource
			const eventSeriesHash = guid()
			const eventSeriesResourceId = slugify(`event-series~${eventSeriesHash}`)

			const newEventSeries = {
				id: eventSeriesResourceId,
				type: 'event-series',
				fields: {
					...eventSeriesInput.fields,
					title: eventSeriesInput.fields.title,
					state: 'draft',
					visibility: 'public',
					slug: slugify(`${eventSeriesInput.fields.title}~${eventSeriesHash}`),
				},
				createdById: user.id,
			}

			await tx.insert(contentResource).values(newEventSeries)

			// Fetch the created event series with relations
			const eventSeriesResource = await tx.query.contentResource.findFirst({
				where: eq(contentResource.id, eventSeriesResourceId),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: true,
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
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

			const parsedEventSeries = EventSeriesSchema.safeParse(eventSeriesResource)
			if (!parsedEventSeries.success) {
				throw new Error('Error parsing event series resource')
			}

			// Step 2: Associate tags with event series
			if (eventSeriesInput.fields.tagIds) {
				await tx.insert(contentResourceTag).values(
					eventSeriesInput.fields.tagIds.map((tag) => ({
						contentResourceId: eventSeriesResourceId,
						tagId: tag.id,
						createdAt: new Date(),
						updatedAt: new Date(),
						position: 0,
					})),
				)
			}

			// Step 3: Create child events and associate them
			const createdChildEvents: Event[] = []

			for (let i = 0; i < childEventsInput.length; i++) {
				const childEventInput = childEventsInput[i]

				if (!childEventInput) {
					throw new Error(`Child event input is required`)
				}

				// Create child event
				const childEventHash = guid()
				const childEventResourceId = slugify(`event~${childEventHash}`)

				const newChildEvent = {
					id: childEventResourceId,
					type: 'event',
					fields: {
						title: childEventInput.fields.title,
						startsAt: childEventInput.fields.startsAt,
						endsAt: childEventInput.fields.endsAt,
						description: childEventInput.fields.description,
						state: 'draft',
						visibility: 'public',
						slug: slugify(`${childEventInput.fields.title}~${childEventHash}`),
						// No price/quantity - they're on the event series
						price: null,
						quantity: null,
					},
					createdById: user.id,
				}

				await tx.insert(contentResource).values(newChildEvent)

				// Fetch the created child event with relations
				const childEventResource = await tx.query.contentResource.findFirst({
					where: eq(contentResource.id, childEventResourceId),
					with: {
						resources: {
							with: {
								resource: {
									with: {
										resources: {
											with: {
												resource: true,
											},
											orderBy: asc(contentResourceResource.position),
										},
									},
								},
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

				const parsedChildEvent = EventSchema.safeParse(childEventResource)
				if (!parsedChildEvent.success) {
					throw new Error(`Error parsing child event resource ${i + 1}`)
				}

				// Associate tags with child event
				if (childEventInput.fields.tagIds) {
					await tx.insert(contentResourceTag).values(
						childEventInput.fields.tagIds.map((tag) => ({
							contentResourceId: childEventResourceId,
							tagId: tag.id,
							createdAt: new Date(),
							updatedAt: new Date(),
							position: 0,
						})),
					)
				}

				// Associate child event with event series
				await tx.insert(contentResourceResource).values({
					resourceOfId: eventSeriesResourceId,
					resourceId: childEventResourceId,
					position: i,
				})

				createdChildEvents.push(parsedChildEvent.data)
			}

			return {
				eventSeries: parsedEventSeries.data,
				childEvents: createdChildEvents,
			}
		})

		eventSeries = result.eventSeries
		childEvents = result.childEvents

		// Step 4: Handle product creation outside transaction (if needed)
		if (
			eventSeriesInput.sharedFields.price &&
			eventSeriesInput.sharedFields.price > 0
		) {
			try {
				sharedProduct = await createProduct({
					name: eventSeriesInput.fields.title,
					price: eventSeriesInput.sharedFields.price,
					quantityAvailable: eventSeriesInput.sharedFields.quantity ?? -1,
					type: 'live',
					state: 'published',
					visibility: 'public',
				})
				if (sharedProduct) {
					await addResourceToProduct({
						resource: eventSeries,
						productId: sharedProduct.id,
					})

					// Create coupon if enabled
					if (
						input.coupon?.enabled &&
						input.coupon.percentageDiscount &&
						input.coupon.expires
					) {
						try {
							const couponInput: CouponInput = {
								quantity: '1',
								maxUses: 1,
								expires: input.coupon.expires,
								restrictedToProductId: sharedProduct.id,
								percentageDiscount: input.coupon.percentageDiscount,
								status: 1,
								default: true,
								fields: {},
							}
							await createCoupon(couponInput)
							await log.info('event.series.coupon.success', {
								eventSeriesId: eventSeries.id,
								productId: sharedProduct.id,
								userId: user.id,
								percentageDiscount: input.coupon.percentageDiscount,
							})
						} catch (couponError) {
							console.error(
								'Error creating coupon for event series',
								couponError,
							)
							await log.error('event.series.coupon.failed', {
								eventSeriesId: eventSeries.id,
								productId: sharedProduct.id,
								userId: user.id,
								error: getErrorMessage(couponError),
								stack: getErrorStack(couponError),
							})
							// Don't throw here - event series creation should succeed even if coupon fails
						}
					}
				} else {
					await log.error('event.series.product.failed', {
						eventSeriesId: eventSeries.id,
						userId: user.id,
						price: eventSeriesInput.sharedFields.price,
					})
				}
			} catch (error) {
				await log.error('event.series.product.creation.failed', {
					eventSeriesId: eventSeries.id,
					userId: user.id,
					error: getErrorMessage(error),
					stack: getErrorStack(error),
				})
				// Note: We don't throw here since the core data is already committed
				console.error('Error creating and associating product', error)
			}
		}

		// Step 5: Handle external service calls (outside transaction)
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
			await log.error('event.series.inngest.failed', {
				eventSeriesId: eventSeries.id,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
			console.error(`Error dispatching ${RESOURCE_CREATED_EVENT}`, error)
		}

		// Step 6: Update TypeSense (outside transaction)
		try {
			await upsertPostToTypeSense(eventSeries, 'save')
			for (const childEvent of childEvents) {
				await upsertPostToTypeSense(childEvent, 'save')
			}
		} catch (error) {
			await log.error('event.series.typesense.failed', {
				eventSeriesId: eventSeries.id,
				error: getErrorMessage(error),
				stack: getErrorStack(error),
			})
			console.error('Error updating TypeSense', error)
		}

		// Logging for successful creation
		await log.info('event.series.created', {
			eventSeriesId: eventSeries.id,
			userId: user.id,
			childEventCount: childEvents.length,
		})

		for (let i = 0; i < childEvents.length; i++) {
			await log.info('event.series.child.created', {
				childEventId: childEvents[i]!.id,
				eventSeriesId: eventSeries.id,
				position: i,
				userId: user.id,
			})
		}

		await log.info('event.series.completed', {
			eventSeriesId: eventSeries.id,
			childEventIds: childEvents.map((e) => e.id),
			userId: user.id,
		})

		return { eventSeries, childEvents }
	} catch (error) {
		await log.error('event.series.creation.failed', {
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			userId: user.id,
			eventCount: input.childEvents.length,
		})
		throw error
	}
}

/**
 * Attaches a reminder email resource to an event
 * @param eventId - The ID of the event
 * @param emailResourceId - The ID of the email resource to attach
 * @param hoursInAdvance - Number of hours before the event to send the reminder (optional - will preserve existing if not specified)
 * @param detachExisting - Whether to detach existing reminder emails before attaching new one (default: false)
 * @returns True if successful, false otherwise
 */
export async function attachReminderEmailToEvent(
	eventId: string,
	emailResourceId: string,
	hoursInAdvance?: number,
	detachExisting: boolean = false,
) {
	try {
		// Validate that the emailResourceId exists and is of type 'email'
		const emailResource = await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.id, emailResourceId),
				eq(contentResource.type, 'email'),
			),
		})

		if (!emailResource) {
			await log.error('event.reminder-email.attach.invalid-email', {
				eventId,
				emailResourceId,
				error: 'Email resource not found or not of type email',
			})
			throw new Error(
				`Email resource with id ${emailResourceId} not found or not of type 'email'`,
			)
		}

		// If hoursInAdvance is not specified, try to find existing metadata for this email
		let finalHoursInAdvance = hoursInAdvance
		if (finalHoursInAdvance === undefined) {
			const existingEmailRef = await db.query.contentResourceResource.findFirst(
				{
					where: and(
						eq(contentResourceResource.resourceId, emailResourceId),
						eq(
							sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
							'event-reminder',
						),
					),
				},
			)

			finalHoursInAdvance = existingEmailRef?.metadata?.hoursInAdvance || 24
		}

		// Execute delete and insert operations in a transaction for atomicity
		const result = await db.transaction(async (tx) => {
			let detachedCount = 0

			// Only detach existing reminder emails if explicitly requested
			if (detachExisting) {
				// Use join to optimize query performance instead of subquery
				const existingReminderEmails = await tx
					.select({
						resourceOfId: contentResourceResource.resourceOfId,
						resourceId: contentResourceResource.resourceId,
					})
					.from(contentResourceResource)
					.innerJoin(
						contentResource,
						eq(contentResource.id, contentResourceResource.resourceId),
					)
					.where(
						and(
							eq(contentResourceResource.resourceOfId, eventId),
							eq(contentResource.type, 'email'),
							eq(
								sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
								'event-reminder',
							),
						),
					)

				// If there are existing reminder emails, detach them
				if (existingReminderEmails.length > 0) {
					for (const existingEmail of existingReminderEmails) {
						await tx
							.delete(contentResourceResource)
							.where(
								and(
									eq(contentResourceResource.resourceOfId, eventId),
									eq(
										contentResourceResource.resourceId,
										existingEmail.resourceId,
									),
									eq(
										sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
										'event-reminder',
									),
								),
							)

						detachedCount++
					}
				}
			}

			// Now attach the new reminder email
			const insertResult = await tx.insert(contentResourceResource).values({
				resourceOfId: eventId,
				resourceId: emailResourceId,
				metadata: {
					type: 'event-reminder',
					hoursInAdvance: finalHoursInAdvance,
				},
			})

			return { insertResult, detachedCount }
		})

		// Log success after transaction completes
		if (result.detachedCount > 0) {
			await log.info('event.reminder-email.existing-detached', {
				eventId,
				detachedCount: result.detachedCount,
			})
		}

		await log.info('event.reminder-email.attached', {
			eventId,
			emailResourceId,
			hoursInAdvance: finalHoursInAdvance,
		})

		return result.insertResult
	} catch (error) {
		await log.error('event.reminder-email.attach.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			eventId,
			emailResourceId,
		})
		return null
	}
}

/**
 * Detaches a reminder email resource from an event
 * @param eventId - The ID of the event
 * @param emailResourceId - The ID of the email resource to detach
 * @returns True if successful, false otherwise
 */
export async function detachReminderEmailFromEvent(
	eventId: string,
	emailResourceId: string,
) {
	try {
		await db
			.delete(contentResourceResource)
			.where(
				and(
					eq(contentResourceResource.resourceOfId, eventId),
					eq(contentResourceResource.resourceId, emailResourceId),
					eq(
						sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
						'event-reminder',
					),
				),
			)

		await log.info('event.reminder-email.detached', {
			eventId,
			emailResourceId,
		})

		return true
	} catch (error) {
		await log.error('event.reminder-email.detach.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			eventId,
			emailResourceId,
		})
		return false
	}
}

/**
 * Gets the reminder email attached to an event
 * @param eventId - The ID of the event
 * @returns The email resource or null if none attached
 */
export async function getEventReminderEmail(eventId: string) {
	try {
		const reminderEmail = await db.query.contentResourceResource.findFirst({
			where: and(
				eq(contentResourceResource.resourceOfId, eventId),
				eq(
					sql`(SELECT type FROM ${contentResource} WHERE id = ${contentResourceResource.resourceId})`,
					'email',
				),
				eq(
					sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
					'event-reminder',
				),
			),
			with: {
				resource: true,
			},
		})

		return reminderEmail?.resource || null
	} catch (error) {
		await log.error('event.reminder-email.get.failed', {
			error: error instanceof Error ? error.message : String(error),
			eventId,
		})
		return null
	}
}

export async function getEventReminderEmails(eventId: string) {
	const reminderEmailsRefs = await db.query.contentResourceResource.findMany({
		where: and(
			eq(contentResourceResource.resourceOfId, eventId),
			eq(
				sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
				'event-reminder',
			),
		),
		orderBy: asc(contentResourceResource.createdAt),
		with: {
			resource: {
				with: {
					resources: {
						with: {
							resource: true,
						},
					},
				},
			},
		},
	})

	const reminderEmails = await Promise.all(
		reminderEmailsRefs.map(async (ref) => {
			const email = ref.resource
			return email
		}),
	)

	const parsedReminderEmails = z.array(EmailSchema).safeParse(reminderEmails)
	if (!parsedReminderEmails.success) {
		console.error('Error parsing reminder emails', reminderEmails)
		return []
	}

	return parsedReminderEmails.data
}

export async function getAllReminderEmails() {
	const reminderEmailsRefs = await db.query.contentResourceResource.findMany({
		where: and(
			eq(
				sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
				'event-reminder',
			),
		),
		orderBy: asc(contentResourceResource.createdAt),
		with: {
			resource: {
				with: {
					resources: {
						with: {
							resource: true,
						},
					},
				},
			},
		},
	})

	const reminderEmails = await Promise.all(
		reminderEmailsRefs.map(async (ref) => {
			const email = ref.resource
			return email
		}),
	)

	const parsedReminderEmails = z.array(EmailSchema).safeParse(reminderEmails)
	if (!parsedReminderEmails.success) {
		console.error('Error parsing reminder emails', reminderEmails)
		return {
			emails: [],
			refs: [],
		}
	}

	// remove duplicates
	const uniqueReminderEmails = parsedReminderEmails.data.filter(
		(email, index, self) => index === self.findIndex((t) => t.id === email.id),
	)

	const uniqueRefs = reminderEmailsRefs.filter(
		(ref, index, self) =>
			index ===
			self.findIndex(
				(t) =>
					t.resourceId === ref.resourceId &&
					t.resourceOfId === ref.resourceOfId,
			),
	)

	return { emails: uniqueReminderEmails || [], refs: uniqueRefs || [] }
}

export async function createAndAttachReminderEmailToEvent(
	eventId: string,
	input: NewEmail,
	hoursInAdvance: number = 24,
	detachExisting: boolean = false,
) {
	const reminderEmail = await createEmail(input)
	if (!reminderEmail) {
		throw new Error('Failed to create reminder email')
	}
	const result = await attachReminderEmailToEvent(
		eventId,
		reminderEmail.id,
		hoursInAdvance,
		detachExisting,
	)

	if (!result) {
		throw new Error('Failed to attach reminder email to event')
	}
	return reminderEmail
}

/**
 * Updates the hoursInAdvance for an attached reminder email
 * @param eventId - The ID of the event
 * @param emailResourceId - The ID of the email resource
 * @param hoursInAdvance - Number of hours before the event to send the reminder
 * @returns True if successful, false otherwise
 */
export async function updateReminderEmailHours(
	eventId: string,
	emailResourceId: string,
	hoursInAdvance: number,
) {
	try {
		const result = await db
			.update(contentResourceResource)
			.set({
				metadata: {
					type: 'event-reminder',
					hoursInAdvance,
				},
			})
			.where(
				and(
					eq(contentResourceResource.resourceOfId, eventId),
					eq(contentResourceResource.resourceId, emailResourceId),
					eq(
						sql`JSON_EXTRACT (${contentResourceResource.metadata}, "$.type")`,
						'event-reminder',
					),
				),
			)

		await log.info('event.reminder-email.hours-updated', {
			eventId,
			emailResourceId,
			hoursInAdvance,
		})

		return result
	} catch (error) {
		await log.error('event.reminder-email.hours-update.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			eventId,
			emailResourceId,
			hoursInAdvance,
		})
		return null
	}
}

/**
 * Get subscribers for an event who should receive reminder emails
 * Based on users who purchased products associated with the event
 * Handles both individual events and child events within event-series
 *
 * @param eventId - The ID of the event (can be individual event or child event in a series)
 * @returns Array of users who purchased the event and should receive reminder emails
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
			// Check if this event is a child resource of an event-series
			const parentEventSeries =
				await db.query.contentResourceResource.findFirst({
					where: eq(contentResourceResource.resourceId, eventId),
					with: {
						resourceOf: true, // This should be the parent event-series
					},
				})

			if (parentEventSeries?.resourceOf?.type === 'event-series') {
				await log.info('event.subscribers.checking-parent-series', {
					eventId,
					parentEventSeriesId: parentEventSeries.resourceOfId,
					message:
						'Event is child of event-series, checking parent for products',
				})

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
			await log.info('event.subscribers.no-products', {
				eventId,
				message:
					'No products associated with this event or its parent event-series',
			})
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
			await log.info('event.subscribers.no-purchases', {
				eventId,
				productIds,
				message: 'No purchases found for event products',
			})
			return []
		}

		// Extract unique users (in case someone bought multiple products for the same event)
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

		await log.info('event.subscribers.found', {
			eventId,
			productIds,
			totalPurchases: eventPurchases.length,
			uniqueSubscribers: subscribers.length,
			foundViaParentSeries: eventProducts.some(
				(ep) =>
					// Check if any product was found via parent series (resourceId != eventId)
					ep.resourceId !== eventId,
			),
		})

		return subscribers
	} catch (error) {
		await log.error('event.subscribers.error', {
			eventId,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
		})

		// Return empty array on error to prevent reminder system from crashing
		return []
	}
}
