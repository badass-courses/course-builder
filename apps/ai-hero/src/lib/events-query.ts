import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	purchases,
} from '@/db/schema'
import { EmailSchema, type NewEmail } from '@/lib/emails'
import { createEmail } from '@/lib/emails-query'
import { EventSchema, EventSeriesSchema } from '@/lib/events'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

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

/**
 * Retrieves an event or event-series by ID or slug
 * Handles both single events and event series (with child events)
 *
 * @param eventIdOrSlug - The ID or slug of the event/event-series
 * @returns The parsed event or event-series, or null if not found
 */
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

	if (!eventData) {
		return null
	}

	let parsedEvent
	if (eventData.type === 'event') {
		parsedEvent = EventSchema.safeParse(eventData)
	} else if (eventData.type === 'event-series') {
		parsedEvent = EventSeriesSchema.safeParse(eventData)
	} else {
		console.error('Unknown event type', eventData.type)
		return null
	}

	if (!parsedEvent.success) {
		console.error('Error parsing event', eventData, parsedEvent.error)
		return null
	}

	return parsedEvent.data
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
 * Get all reminder emails attached to a specific event
 *
 * @param eventId - The ID of the event
 * @returns Array of parsed Email objects with reminder metadata, ordered by creation date
 */
export async function getEventReminderEmails(eventId: string) {
	const reminderRefs = await db.query.contentResourceResource.findMany({
		where: and(
			eq(contentResourceResource.resourceOfId, eventId),
			eq(
				sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
				'event-reminder',
			),
		),
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
		orderBy: asc(contentResourceResource.createdAt),
	})

	const emails = reminderRefs.map((ref) => ref.resource)
	const parsedEmails = z.array(EmailSchema).safeParse(emails)

	if (!parsedEmails.success) {
		console.error('Error parsing event reminder emails', emails)
		return []
	}

	return parsedEmails.data
}

/**
 * Get all reminder emails across all events
 *
 * @returns Object containing unique emails and their event associations
 */
export async function getAllReminderEmails() {
	const reminderRefs = await db.query.contentResourceResource.findMany({
		where: eq(
			sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
			'event-reminder',
		),
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
		orderBy: asc(contentResourceResource.createdAt),
	})

	// Collect emails from refs
	const emailsMap = new Map()
	for (const ref of reminderRefs) {
		if (ref.resource && !emailsMap.has(ref.resource.id)) {
			emailsMap.set(ref.resource.id, ref.resource)
		}
	}

	// Also fetch all email-type resources (includes detached ones)
	const allEmailResources = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'email'),
		orderBy: asc(contentResource.createdAt),
	})

	for (const emailResource of allEmailResources) {
		if (!emailsMap.has(emailResource.id)) {
			emailsMap.set(emailResource.id, emailResource)
		}
	}

	const emails = Array.from(emailsMap.values())
	const parsedEmails = z.array(EmailSchema).safeParse(emails)

	if (!parsedEmails.success) {
		console.error('Error parsing all reminder emails', emails)
		return { emails: [], refs: reminderRefs }
	}

	// Deduplicate refs by resourceId + resourceOfId
	const uniqueRefs = reminderRefs.filter(
		(ref, index, self) =>
			index ===
			self.findIndex(
				(r) =>
					r.resourceId === ref.resourceId &&
					r.resourceOfId === ref.resourceOfId,
			),
	)

	return {
		emails: parsedEmails.data,
		refs: uniqueRefs,
	}
}

/**
 * Attach a reminder email to an event
 *
 * @param eventId - The ID of the event
 * @param emailResourceId - The ID of the email resource to attach
 * @param hoursInAdvance - Hours before event to send reminder (optional, will look up existing if not provided)
 * @param detachExisting - Whether to detach existing reminders first (default: false)
 * @returns The insert result
 */
export async function attachReminderEmailToEvent(
	eventId: string,
	emailResourceId: string,
	hoursInAdvance?: number,
	detachExisting: boolean = false,
) {
	// Validate email resource exists and is type='email'
	const emailResource = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.id, emailResourceId),
			eq(contentResource.type, 'email'),
		),
	})

	if (!emailResource) {
		throw new Error('Email resource not found or not of type email')
	}

	// If hoursInAdvance not provided, look up existing metadata
	let hours = hoursInAdvance
	if (hours === undefined) {
		const existing = await db.query.contentResourceResource.findFirst({
			where: and(
				eq(contentResourceResource.resourceOfId, eventId),
				eq(contentResourceResource.resourceId, emailResourceId),
				eq(
					sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
					'event-reminder',
				),
			),
		})
		if (existing?.metadata) {
			hours = (existing.metadata as any).hoursInAdvance || 24
		} else {
			hours = 24 // Default to 24 hours
		}
	}

	return await db.transaction(async (tx) => {
		// Optionally detach existing reminders
		if (detachExisting) {
			await tx
				.delete(contentResourceResource)
				.where(
					and(
						eq(contentResourceResource.resourceOfId, eventId),
						eq(
							sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
							'event-reminder',
						),
					),
				)
		}

		// Insert new reminder attachment
		return await tx.insert(contentResourceResource).values({
			resourceOfId: eventId,
			resourceId: emailResourceId,
			metadata: {
				type: 'event-reminder',
				hoursInAdvance: hours,
			},
		})
	})
}

/**
 * Detach a reminder email from an event
 *
 * @param eventId - The ID of the event
 * @param emailResourceId - The ID of the email resource to detach
 * @returns True if successfully detached
 */
export async function detachReminderEmailFromEvent(
	eventId: string,
	emailResourceId: string,
) {
	await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceOfId, eventId),
				eq(contentResourceResource.resourceId, emailResourceId),
				eq(
					sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
					'event-reminder',
				),
			),
		)

	return true
}

/**
 * Create a new email and attach it as a reminder to an event
 *
 * @param eventId - The ID of the event
 * @param input - The new email data
 * @param hoursInAdvance - Hours before event to send reminder (default: 24)
 * @param detachExisting - Whether to detach existing reminders first (default: false)
 * @returns The created email
 */
export async function createAndAttachReminderEmailToEvent(
	eventId: string,
	input: NewEmail,
	hoursInAdvance: number = 24,
	detachExisting: boolean = false,
) {
	const email = await createEmail(input)

	if (!email) {
		throw new Error('Failed to create email')
	}

	await attachReminderEmailToEvent(
		eventId,
		email.id,
		hoursInAdvance,
		detachExisting,
	)

	return email
}

/**
 * Update the hoursInAdvance metadata for a reminder email attachment
 *
 * @param eventId - The ID of the event
 * @param emailResourceId - The ID of the email resource
 * @param hoursInAdvance - New hours before event to send reminder
 * @returns The update result
 */
export async function updateReminderEmailHours(
	eventId: string,
	emailResourceId: string,
	hoursInAdvance: number,
) {
	return await db
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
					sql`JSON_EXTRACT(${contentResourceResource.metadata}, "$.type")`,
					'event-reminder',
				),
			),
		)
}

/**
 * Get all users who have purchased access to an event
 *
 * @param eventId - The ID of the event
 * @returns Array of unique users with {id, email, name}
 */
export async function getEventPurchasers(eventId: string) {
	// Find products associated with this event
	const eventProducts = await db.query.contentResourceProduct.findMany({
		where: eq(contentResourceProduct.resourceId, eventId),
	})

	let productIds = eventProducts.map((p) => p.productId)

	// If no products found, check if event is child of event-series
	if (productIds.length === 0) {
		const parentRef = await db.query.contentResourceResource.findFirst({
			where: eq(contentResourceResource.resourceId, eventId),
			with: {
				resourceOf: true,
			},
		})

		if (parentRef?.resourceOf?.type === 'event-series') {
			const parentProducts = await db.query.contentResourceProduct.findMany({
				where: eq(contentResourceProduct.resourceId, parentRef.resourceOfId),
			})
			productIds = parentProducts.map((p) => p.productId)
		}
	}

	// If still no products, return empty array
	if (productIds.length === 0) {
		return []
	}

	// Find all valid purchases for these products
	const validPurchases = await db.query.purchases.findMany({
		where: and(
			inArray(purchases.productId, productIds),
			eq(purchases.status, 'Valid'),
		),
		with: {
			user: true,
		},
	})

	// Extract unique users
	const usersMap = new Map()
	for (const purchase of validPurchases) {
		if (purchase.user && !usersMap.has(purchase.userId)) {
			usersMap.set(purchase.userId, {
				id: purchase.user.id,
				email: purchase.user.email,
				name: purchase.user.name,
			})
		}
	}

	return Array.from(usersMap.values())
}
