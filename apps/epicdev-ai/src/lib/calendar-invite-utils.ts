import { db } from '@/db'
import { contentResourceProduct } from '@/db/schema'
import { EVENT_HOST_EMAIL } from '@/inngest/functions/calendar-sync'
import { getEventOrEventSeries } from '@/lib/events-query'
import {
	addUserToGoogleCalendarEvent,
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

		const inviteFunction = addRateLimit
			? addUserWithRateLimit
			: addUserToGoogleCalendarEvent

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

	// Process each office hours event
	for (const event of officeHoursEvents) {
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

		// Process each calendar event
		for (const calendarEvent of calendarEventsToProcess) {
			const calendarResult = await processCalendarEventInvites({
				calendarId: calendarEvent.calendarId,
				eventTitle: calendarEvent.eventTitle,
				purchasers: purchaseData.data,
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
			} as any)

			eventResult.totalSuccessful += calendarResult.successCount
			eventResult.totalFailed += calendarResult.failedCount
			eventResult.totalSkipped += calendarResult.skippedCount
		}

		eventResults.push(eventResult)
		totalSuccessfulInvites += eventResult.totalSuccessful
		totalFailedInvites += eventResult.totalFailed
		totalSkippedInvites += eventResult.totalSkipped
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
 * Determines if an event is an office hours event based on title or tags
 * Not currently used, but keeping for reference
 */
function isOfficeHoursEvent(event: any): boolean {
	// Check title for "office hours" keywords
	const titleLower = event.fields?.title?.toLowerCase() || ''
	if (
		titleLower.includes('office hours') ||
		titleLower.includes('office hour')
	) {
		return true
	}

	// Check tags for office hours
	if (event.tags && Array.isArray(event.tags)) {
		return event.tags.some((tagItem: any) => {
			const tagName = tagItem.tag?.fields?.name?.toLowerCase() || ''
			return tagName.includes('office hours') || tagName.includes('office hour')
		})
	}

	return false
}
