import { db } from '@/db'
import { contentResourceProduct } from '@/db/schema'
import { EVENT_HOST_EMAIL } from '@/inngest/functions/calendar-sync'
import { getEventOrEventSeries } from '@/lib/events-query'
import {
	addUserToGoogleCalendarEvent,
	bulkAddUsersToGoogleCalendarEvent,
	getGoogleCalendarEventAttendees,
} from '@/lib/google-calendar'
import { getProductPurchaseData } from '@/lib/products/products.service'
import { log } from '@/server/logger'
import { eq } from 'drizzle-orm'

/**
 * Gets office hours events associated with a product
 */
export async function getProductOfficeHoursEvents(productId: string) {
	// Get events directly associated with the product
	const productEvents = await db.query.contentResourceProduct.findMany({
		where: eq(contentResourceProduct.productId, productId),
		with: {
			resource: {
				with: {
					tags: {
						with: {
							tag: true,
						},
					},
				},
			},
		},
	})

	// Filter for events and event-series
	const eventResources = productEvents.filter(
		(pe) => pe.resource.type === 'event' || pe.resource.type === 'event-series',
	)

	// Parse and validate events
	const validEvents = []
	for (const eventResource of eventResources) {
		const parsedEvent = await getEventOrEventSeries(eventResource.resource.id)
		if (parsedEvent) {
			// Check if this is an office hours event
			const isOfficeHours = true // isOfficeHoursEvent(parsedEvent)
			if (isOfficeHours) {
				validEvents.push(parsedEvent)
			}
		}
	}

	return validEvents
}

/**
 * Rate-limited function to add user to calendar event with retry logic
 */
export async function addUserWithRateLimit(
	calendarId: string,
	userEmail: string,
	retryCount = 0,
): Promise<{ success: boolean; error?: string }> {
	try {
		await addUserToGoogleCalendarEvent(calendarId, userEmail)
		return { success: true }
	} catch (error: any) {
		const errorMessage = error.message || 'Unknown error'

		// Check if it's a rate limit error
		if (
			(error.code === 429 || errorMessage.includes('rate limit')) &&
			retryCount < 3
		) {
			// Exponential backoff: 2s, 4s, 8s
			const delay = Math.pow(2, retryCount + 1) * 1000
			await new Promise((resolve) => setTimeout(resolve, delay))
			return addUserWithRateLimit(calendarId, userEmail, retryCount + 1)
		}

		return { success: false, error: errorMessage }
	}
}

/**
 * Processes calendar invites for a single calendar event
 */
export async function processCalendarEventInvites({
	calendarId,
	eventTitle,
	purchasers,
	skipAlreadyInvited = true,
	addRateLimit = false,
}: {
	calendarId: string
	eventTitle: string
	purchasers: Array<{
		user_id: string
		email: string
		name: string | null
		productId: string
		product_name: string
		purchase_date: string
	}>
	skipAlreadyInvited?: boolean
	addRateLimit?: boolean
}): Promise<{
	calendarId: string
	eventTitle: string
	successCount: number
	failedCount: number
	skippedCount: number
	results: Array<{
		email: string
		success: boolean
		error?: string
		skipped?: boolean
		reason?: string
	}>
}> {
	// Get existing attendees (excluding host)
	const existingAttendees = await getGoogleCalendarEventAttendees(calendarId)

	// Skip this event if we can't get attendees (event not found)
	if (existingAttendees === null) {
		await log.warn('calendar.invite.event_not_found', {
			calendarId,
			eventTitle,
		})
		return {
			calendarId,
			eventTitle,
			successCount: 0,
			failedCount: 0,
			skippedCount: 0,
			results: [],
		}
	}

	const existingEmails = new Set(
		existingAttendees
			.filter((a) => a.email !== EVENT_HOST_EMAIL)
			.map((a) => a.email.toLowerCase()),
	)

	let successCount = 0
	let failedCount = 0
	let skippedCount = 0
	const results = []

	// Process each purchaser for this calendar event
	for (const [purchaserIndex, purchaser] of purchasers.entries()) {
		// Skip if already invited (case-insensitive check)
		if (
			skipAlreadyInvited &&
			existingEmails.has(purchaser.email.toLowerCase())
		) {
			skippedCount++
			results.push({
				email: purchaser.email,
				success: true,
				skipped: true,
				reason: 'Already invited to this event',
			})

			await log.info('calendar.invite.user_skipped', {
				calendarId,
				userEmail: purchaser.email,
				userName: purchaser.name,
				reason: 'Already invited',
			})
			continue
		}

		// Rate limiting: delay between calls if requested
		if (addRateLimit && purchaserIndex > 0) {
			await new Promise((resolve) => setTimeout(resolve, 1000))
		}

		try {
			let inviteResult
			if (addRateLimit) {
				inviteResult = await addUserWithRateLimit(calendarId, purchaser.email)
				if (inviteResult.success) {
					successCount++
					// Add to existing emails set to prevent re-inviting in same run
					existingEmails.add(purchaser.email.toLowerCase())
					results.push({
						email: purchaser.email,
						success: true,
					})
				} else {
					failedCount++
					results.push({
						email: purchaser.email,
						success: false,
						error: inviteResult.error,
					})
				}
			} else {
				await addUserToGoogleCalendarEvent(calendarId, purchaser.email)
				successCount++
				results.push({
					email: purchaser.email,
					success: true,
				})
			}

			await log.info('calendar.invite.user_added', {
				calendarId,
				userEmail: purchaser.email,
				userName: purchaser.name,
			})
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			failedCount++
			results.push({
				email: purchaser.email,
				success: false,
				error: errorMessage,
			})

			await log.error('calendar.invite.user_failed', {
				calendarId,
				userEmail: purchaser.email,
				userName: purchaser.name,
				error: errorMessage,
			})
		}
	}

	return {
		calendarId,
		eventTitle,
		successCount,
		failedCount,
		skippedCount,
		results,
	}
}

/**
 * Processes invites for all calendar events associated with office hours events
 */
export async function processAllEventInvites({
	productId,
	addRateLimit = false,
	skipAlreadyInvited = true,
}: {
	productId: string
	addRateLimit?: boolean
	skipAlreadyInvited?: boolean
}): Promise<{
	success: boolean
	message: string
	results: {
		totalPurchasers: number
		totalEvents: number
		successfulInvites: number
		failedInvites: number
		skippedInvites: number
		details: Array<{
			eventId: string
			eventTitle: string
			eventType: 'event' | 'event-series'
			calendarEvents: Array<{
				calendarId: string
				eventTitle: string
				successCount: number
				failedCount: number
				skippedCount: number
				results?: Array<{
					email: string
					success: boolean
					error?: string
					skipped?: boolean
					reason?: string
				}>
			}>
			totalSuccessful: number
			totalFailed: number
			totalSkipped: number
		}>
	}
}> {
	// Get office hours events and purchasers in parallel
	const [officeHoursEvents, purchaseData] = await Promise.all([
		getProductOfficeHoursEvents(productId),
		getProductPurchaseData({
			productIds: [productId],
			limit: 10000,
			offset: 0,
		}),
	])

	if (officeHoursEvents.length === 0) {
		return {
			success: false,
			message: 'No office hours events found for this cohort product',
			results: {
				totalPurchasers: 0,
				totalEvents: 0,
				successfulInvites: 0,
				failedInvites: 0,
				skippedInvites: 0,
				details: [],
			},
		}
	}

	if (purchaseData.data.length === 0) {
		return {
			success: false,
			message: 'No purchasers found for this product',
			results: {
				totalPurchasers: 0,
				totalEvents: 0,
				successfulInvites: 0,
				failedInvites: 0,
				skippedInvites: 0,
				details: [],
			},
		}
	}

	let totalSuccessfulInvites = 0
	let totalFailedInvites = 0
	let totalSkippedInvites = 0
	const eventResults = []

	// Process each office hours event SEQUENTIALLY to avoid hitting API limits
	// Since we found Google allows ~50 API calls before rate limiting
	let totalApiCallsUsed = 0
	const MAX_TOTAL_API_CALLS = 45 // Conservative limit across all events

	for (const [eventIndex, event] of officeHoursEvents.entries()) {
		// Check if we're approaching the global API limit
		if (totalApiCallsUsed >= MAX_TOTAL_API_CALLS) {
			await log.warn('calendar.invite.api_limit_reached', {
				totalApiCallsUsed,
				remainingEvents: officeHoursEvents.length - eventIndex,
			})
			break
		}

		const eventResult = {
			eventId: event.id,
			eventTitle: event.fields?.title || 'Untitled Event',
			eventType: event.type as 'event' | 'event-series',
			calendarEvents: [] as Array<{
				calendarId: string
				eventTitle: string
				successCount: number
				failedCount: number
				skippedCount: number
			}>,
			totalSuccessful: 0,
			totalFailed: 0,
			totalSkipped: 0,
		}

		// Add delay between different events to avoid overwhelming the API
		if (eventIndex > 0) {
			const eventDelay = 5000 // 5 seconds between different events
			await log.info('calendar.invite.event_delay', {
				eventIndex,
				delay: eventDelay,
			})
			await new Promise((resolve) => setTimeout(resolve, eventDelay))
		}

		// Handle both single events and event series
		const calendarEventsToProcess = []

		if (event.type === 'event-series' && event.resources) {
			for (const { resource: childEvent } of event.resources) {
				if (
					childEvent?.type === 'event' &&
					'calendarId' in childEvent.fields &&
					childEvent.fields.calendarId
				) {
					calendarEventsToProcess.push({
						calendarId: childEvent.fields.calendarId as string,
						eventTitle: childEvent.fields.title || 'Untitled Child Event',
					})
				}
			}
		} else if (
			event.type === 'event' &&
			'calendarId' in event.fields &&
			event.fields.calendarId
		) {
			calendarEventsToProcess.push({
				calendarId: event.fields.calendarId as string,
				eventTitle: event.fields?.title || 'Untitled Event',
			})
		}

		// Process each calendar event SEQUENTIALLY
		for (const [calIndex, calendarEvent] of calendarEventsToProcess.entries()) {
			// Check API limit before processing
			if (totalApiCallsUsed >= MAX_TOTAL_API_CALLS) {
				await log.warn('calendar.invite.skipping_calendar_event', {
					calendarId: calendarEvent.calendarId,
					reason: 'API limit reached',
				})
				break
			}

			// Add delay between calendar events in a series
			if (calIndex > 0) {
				await new Promise((resolve) => setTimeout(resolve, 3000))
			}

			const calendarResult = await processCalendarEventInvites({
				calendarId: calendarEvent.calendarId,
				eventTitle: calendarEvent.eventTitle,
				purchasers: purchaseData.data,
				skipAlreadyInvited,
				addRateLimit,
			})

			// Estimate API calls used (rough estimate: 1 call per 100 attendees added)
			const estimatedApiCalls = Math.ceil(calendarResult.successCount / 100) + 1
			totalApiCallsUsed += estimatedApiCalls

			eventResult.calendarEvents.push({
				calendarId: calendarResult.calendarId,
				eventTitle: calendarResult.eventTitle,
				successCount: calendarResult.successCount,
				failedCount: calendarResult.failedCount,
				skippedCount: calendarResult.skippedCount,
				results: calendarResult.results,
			} as any)

			eventResult.totalSuccessful += calendarResult.successCount
			eventResult.totalFailed += calendarResult.failedCount
			eventResult.totalSkipped += calendarResult.skippedCount
		}

		eventResults.push(eventResult)
		totalSuccessfulInvites += eventResult.totalSuccessful
		totalFailedInvites += eventResult.totalFailed
		totalSkippedInvites += eventResult.totalSkipped

		await log.info('calendar.invite.event_completed', {
			eventId: event.id,
			totalApiCallsUsed,
			successful: eventResult.totalSuccessful,
			failed: eventResult.totalFailed,
			skipped: eventResult.totalSkipped,
		})
	}

	return {
		success: true,
		message: `Successfully processed calendar invites. ${totalSuccessfulInvites} invites sent, ${totalSkippedInvites} already invited, ${totalFailedInvites} failed.`,
		results: {
			totalPurchasers: purchaseData.data.length,
			totalEvents: officeHoursEvents.length,
			successfulInvites: totalSuccessfulInvites,
			failedInvites: totalFailedInvites,
			skippedInvites: totalSkippedInvites,
			details: eventResults,
		},
	}
}

/**
 * Gets office hours events and purchase data for a product
 * This is the first step in processing bulk calendar invites
 */
export async function getOfficeHoursAndPurchaseData({
	productId,
}: {
	productId: string
}): Promise<{
	success: boolean
	message?: string
	officeHoursEvents: any[]
	purchasers: Array<{
		user_id: string
		email: string
		name: string | null
		productId: string
		product_name: string
		purchase_date: string
	}>
}> {
	// Get office hours events and purchasers in parallel
	const [officeHoursEvents, purchaseData] = await Promise.all([
		getProductOfficeHoursEvents(productId),
		getProductPurchaseData({
			productIds: [productId],
			limit: 10000,
			offset: 0,
		}),
	])

	if (officeHoursEvents.length === 0) {
		return {
			success: false,
			message: 'No office hours events found for this cohort product',
			officeHoursEvents: [],
			purchasers: [],
		}
	}

	if (purchaseData.data.length === 0) {
		return {
			success: false,
			message: 'No purchasers found for this product',
			officeHoursEvents,
			purchasers: [],
		}
	}

	return {
		success: true,
		officeHoursEvents,
		purchasers: purchaseData.data,
	}
}

/**
 * Bulk processes calendar invites for a single calendar event
 * Uses a single API call to add all purchasers at once
 */
export async function processCalendarEventInvitesBulk({
	calendarId,
	eventTitle,
	purchasers,
	skipAlreadyInvited = true,
}: {
	calendarId: string
	eventTitle: string
	purchasers: Array<{
		user_id: string
		email: string
		name: string | null
		productId: string
		product_name: string
		purchase_date: string
	}>
	skipAlreadyInvited?: boolean
}): Promise<{
	calendarId: string
	eventTitle: string
	successCount: number
	failedCount: number
	skippedCount: number
	results: Array<{
		email: string
		success: boolean
		error?: string
		skipped?: boolean
		reason?: string
	}>
}> {
	// Check if event exists first
	const existingAttendees = await getGoogleCalendarEventAttendees(calendarId)

	// Skip this event if we can't get attendees (event not found)
	if (existingAttendees === null) {
		await log.warn('calendar.invite.event_not_found', {
			calendarId,
			eventTitle,
		})
		return {
			calendarId,
			eventTitle,
			successCount: 0,
			failedCount: 0,
			skippedCount: 0,
			results: [],
		}
	}

	// Extract all purchaser emails
	const allEmails = purchasers.map((p) => p.email)

	// Bulk add users to the calendar event
	const bulkResult = await bulkAddUsersToGoogleCalendarEvent(
		calendarId,
		allEmails,
		skipAlreadyInvited,
	)

	// Log the bulk operation result
	if (bulkResult.success) {
		await log.info('calendar.invite.bulk_add_completed', {
			calendarId,
			eventTitle,
			addedCount: bulkResult.addedCount,
			skippedCount: bulkResult.skippedCount,
			totalPurchasers: purchasers.length,
		})
	} else {
		await log.error('calendar.invite.bulk_add_failed', {
			calendarId,
			eventTitle,
			error: bulkResult.error,
			totalPurchasers: purchasers.length,
		})
	}

	// Create detailed results for consistency with existing API
	const results: Array<{
		email: string
		success: boolean
		error?: string
		skipped?: boolean
		reason?: string
	}> = []

	if (bulkResult.success) {
		// For successful bulk operation, create individual result entries
		const existingEmailsSet = new Set(
			existingAttendees
				.filter((a) => a.email !== EVENT_HOST_EMAIL)
				.map((a) => a.email.toLowerCase()),
		)

		for (const purchaser of purchasers) {
			const emailLower = purchaser.email.toLowerCase()
			if (skipAlreadyInvited && existingEmailsSet.has(emailLower)) {
				results.push({
					email: purchaser.email,
					success: true,
					skipped: true,
					reason: 'Already invited to this event',
				})
			} else {
				results.push({
					email: purchaser.email,
					success: true,
				})
			}
		}
	} else {
		// For failed bulk operation, mark all as failed
		for (const purchaser of purchasers) {
			results.push({
				email: purchaser.email,
				success: false,
				error: bulkResult.error,
			})
		}
	}

	return {
		calendarId,
		eventTitle,
		successCount: bulkResult.success ? bulkResult.addedCount : 0,
		failedCount: bulkResult.success ? 0 : purchasers.length,
		skippedCount: bulkResult.success ? bulkResult.skippedCount : 0,
		results,
	}
}

/**
 * Processes invites for a single office hours event
 * Handles both single events and event series
 */
export async function processSingleEventInvites({
	event,
	purchasers,
	skipAlreadyInvited = true,
	addRateLimit = false,
	useBulkMode = true,
}: {
	event: any
	purchasers: Array<{
		user_id: string
		email: string
		name: string | null
		productId: string
		product_name: string
		purchase_date: string
	}>
	skipAlreadyInvited?: boolean
	addRateLimit?: boolean
	useBulkMode?: boolean
}): Promise<{
	eventId: string
	eventTitle: string
	eventType: 'event' | 'event-series'
	calendarEvents: Array<{
		calendarId: string
		eventTitle: string
		successCount: number
		failedCount: number
		skippedCount: number
		results?: Array<{
			email: string
			success: boolean
			error?: string
			skipped?: boolean
			reason?: string
		}>
	}>
	totalSuccessful: number
	totalFailed: number
	totalSkipped: number
}> {
	let eventResult = {
		eventId: event.id,
		eventTitle: event.fields?.title || 'Untitled Event',
		eventType: event.type as 'event' | 'event-series',
		calendarEvents: [] as Array<{
			calendarId: string
			eventTitle: string
			successCount: number
			failedCount: number
			skippedCount: number
			results?: Array<{
				email: string
				success: boolean
				error?: string
				skipped?: boolean
				reason?: string
			}>
		}>,
		totalSuccessful: 0,
		totalFailed: 0,
		totalSkipped: 0,
	}

	// Handle both single events and event series
	const calendarEventsToProcess = []

	if (event.type === 'event-series' && event.resources) {
		for (const { resource: childEvent } of event.resources) {
			if (
				childEvent?.type === 'event' &&
				'calendarId' in childEvent.fields &&
				childEvent.fields.calendarId
			) {
				calendarEventsToProcess.push({
					calendarId: childEvent.fields.calendarId as string,
					eventTitle: childEvent.fields.title || 'Untitled Child Event',
				})
			}
		}
	} else if (
		event.type === 'event' &&
		'calendarId' in event.fields &&
		event.fields.calendarId
	) {
		calendarEventsToProcess.push({
			calendarId: event.fields.calendarId as string,
			eventTitle: event.fields?.title || 'Untitled Event',
		})
	}

	// Process each calendar event SEQUENTIALLY with delays
	for (const [index, calendarEvent] of calendarEventsToProcess.entries()) {
		// Add delay between calendar events to avoid rate limiting
		if (index > 0) {
			const delayMs = 3000 // 3 seconds between events
			await log.info('calendar.invite.inter_event_delay', {
				delayMs,
				eventIndex: index,
				totalEvents: calendarEventsToProcess.length,
			})
			await new Promise((resolve) => setTimeout(resolve, delayMs))
		}

		// Use bulk mode if enabled, otherwise fall back to individual invites
		const calendarResult = useBulkMode
			? await processCalendarEventInvitesBulk({
					calendarId: calendarEvent.calendarId,
					eventTitle: calendarEvent.eventTitle,
					purchasers,
					skipAlreadyInvited,
				})
			: await processCalendarEventInvites({
					calendarId: calendarEvent.calendarId,
					eventTitle: calendarEvent.eventTitle,
					purchasers,
					skipAlreadyInvited,
					addRateLimit,
				})

		eventResult.calendarEvents.push({
			calendarId: calendarResult.calendarId,
			eventTitle: calendarResult.eventTitle,
			successCount: calendarResult.successCount,
			failedCount: calendarResult.failedCount,
			skippedCount: calendarResult.skippedCount,
			results: calendarResult.results,
		})

		eventResult.totalSuccessful += calendarResult.successCount
		eventResult.totalFailed += calendarResult.failedCount
		eventResult.totalSkipped += calendarResult.skippedCount
	}

	return eventResult
}
