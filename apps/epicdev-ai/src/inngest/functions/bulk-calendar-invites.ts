import { courseBuilderAdapter } from '@/db'
import BasicEmail from '@/emails/basic-email'
import { EVENT_HOST_EMAIL } from '@/inngest/functions/calendar-sync'
import { getEventOrEventSeries } from '@/lib/events-query'
import {
	addUserToGoogleCalendarEvent,
	getGoogleCalendarEventAttendees,
} from '@/lib/google-calendar'
import { getProduct } from '@/lib/products-query'
import { getProductPurchaseData } from '@/lib/products/products.service'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { NonRetriableError } from 'inngest'

import {
	BULK_CALENDAR_INVITE_EVENT,
	type BulkCalendarInviteSent,
} from '../events/bulk-calendar-invites'
import { inngest } from '../inngest.server'

/**
 * Gets office hours events associated with a product
 */
async function getProductOfficeHoursEvents(productId: string) {
	const { db } = await import('@/db')
	const { contentResourceProduct } = await import('@/db/schema')
	const { eq } = await import('drizzle-orm')

	// Get events directly associated with the product (same as main function)
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
async function addUserWithRateLimit(
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
 * Background job to process bulk calendar invites for a cohort product
 */
export const processBulkCalendarInvites = inngest.createFunction(
	{
		id: 'process-bulk-calendar-invites',
		name: 'Process Bulk Calendar Invites',
	},
	{ event: BULK_CALENDAR_INVITE_EVENT },
	async ({ event, step }: { event: BulkCalendarInviteSent; step: any }) => {
		const { productId, requestedBy } = event.data

		await log.info('bulk_calendar_invites.started', {
			productId,
			requestedBy: requestedBy.email,
		})

		// Step 1: Get and validate product
		const product = await step.run('get-product', async () => {
			const p = await getProduct(productId)
			if (!p) {
				throw new NonRetriableError(`Product not found: ${productId}`)
			}
			if (p.type !== 'cohort') {
				throw new NonRetriableError(`Product is not a cohort type: ${p.type}`)
			}
			return p
		})

		// Step 2: Get office hours events
		const officeHoursEvents = await step.run(
			'get-office-hours-events',
			async () => {
				const events = await getProductOfficeHoursEvents(product.id)
				if (events.length === 0) {
					throw new NonRetriableError(
						'No office hours events found for this cohort product',
					)
				}
				return events
			},
		)

		// Step 3: Get all purchasers
		const purchaseData = await step.run('get-purchasers', async () => {
			const data = await getProductPurchaseData({
				productIds: [product.id],
				limit: 10000, // Get all purchasers
				offset: 0,
			})
			if (data.data.length === 0) {
				throw new NonRetriableError('No purchasers found for this product')
			}
			return data
		})

		await log.info('bulk_calendar_invites.processing', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalEvents: officeHoursEvents.length,
		})

		// Step 4: Process each event
		let totalSuccessfulInvites = 0
		let totalFailedInvites = 0
		let totalSkippedInvites = 0
		const eventResults: any = []

		for (const [eventIndex, event] of officeHoursEvents.entries()) {
			const eventResult = await step.run(
				`process-event-${event.id}`,
				async () => {
					const result = {
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
						const { calendarId, eventTitle } = calendarEvent

						// Get existing attendees (excluding host)
						const existingAttendees =
							await getGoogleCalendarEventAttendees(calendarId)

						// Skip this event if we can't get attendees (event not found)
						if (existingAttendees === null) {
							continue
						}

						const existingEmails = new Set(
							existingAttendees
								.filter((a) => a.email !== EVENT_HOST_EMAIL)
								.map((a) => a.email.toLowerCase()),
						)

						let successCount = 0
						let failedCount = 0
						let skippedCount = 0

						// Process each purchaser for this calendar event
						for (const [
							purchaserIndex,
							purchaser,
						] of purchaseData.data.entries()) {
							// Skip if already invited (case-insensitive check)
							if (existingEmails.has(purchaser.email.toLowerCase())) {
								skippedCount++
								continue
							}

							// Rate limiting: 1 second delay between calls
							if (purchaserIndex > 0) {
								await new Promise((resolve) => setTimeout(resolve, 1000))
							}

							const inviteResult = await addUserWithRateLimit(
								calendarId,
								purchaser.email,
							)

							if (inviteResult.success) {
								successCount++
								// Add to existing emails set to prevent re-inviting in same run
								existingEmails.add(purchaser.email.toLowerCase())
							} else {
								failedCount++
								await log.warn('bulk_calendar_invites.invite_failed', {
									calendarId,
									userEmail: purchaser.email,
									error: inviteResult.error,
								})
							}
						}

						result.calendarEvents.push({
							calendarId,
							eventTitle,
							successCount,
							failedCount,
							skippedCount,
						})

						result.totalSuccessful += successCount
						result.totalFailed += failedCount
						result.totalSkipped += skippedCount
					}

					return result
				},
			)

			eventResults.push(eventResult)
			totalSuccessfulInvites += eventResult.totalSuccessful
			totalFailedInvites += eventResult.totalFailed
			totalSkippedInvites += eventResult.totalSkipped

			await log.info('bulk_calendar_invites.event_completed', {
				productId,
				eventId: event.id,
				eventTitle: event.fields?.title,
				eventIndex: eventIndex + 1,
				totalEvents: officeHoursEvents.length,
				successfulInvites: eventResult.totalSuccessful,
				failedInvites: eventResult.totalFailed,
				skippedInvites: eventResult.totalSkipped,
			})
		}

		// Step 5: Send completion email
		await step.run('send-completion-email', async () => {
			const completionEmailProps = {
				productName: product.name,
				totalPurchasers: purchaseData.data.length,
				totalEvents: officeHoursEvents.length,
				totalSuccessfulInvites,
				totalFailedInvites,
				totalSkippedInvites,
				eventResults,
				requestedBy: requestedBy.email,
			}

			try {
				await sendAnEmail({
					Component: BasicEmail,
					componentProps: {
						body: `# Calendar Invites Complete

The calendar invitation process for **${product.name}** has finished successfully.

## Summary

- ✅ **${totalSuccessfulInvites}** invites sent successfully
- ⏭️ **${totalSkippedInvites}** users already invited (skipped)
- ❌ **${totalFailedInvites}** invites failed
- 📊 Processed **${purchaseData.data.length}** purchasers across **${officeHoursEvents.length}** events

## Event Details

${eventResults
	.map(
		(e: any) =>
			`### ${e.eventTitle}
- **${e.totalSuccessful}** sent
- **${e.totalSkipped}** skipped  
- **${e.totalFailed}** failed`,
	)
	.join('\n\n')}

---

*Requested by: ${requestedBy.email}*`,
						preview: `Calendar invites complete: ${totalSuccessfulInvites} sent, ${totalSkippedInvites} skipped, ${totalFailedInvites} failed`,
						messageType: 'transactional',
					},
					Subject: `✅ Calendar Invites Complete: ${product.name}`,
					To: requestedBy.email,
					type: 'transactional',
				})
			} catch (error) {
				await log.error('bulk_calendar_invites.email_failed', {
					productId,
					productName: product.name,
					requestedBy: requestedBy.email,
					error: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
				})
				// Don't rethrow - let the step complete even if email fails
			}
		})

		await log.info('bulk_calendar_invites.completed', {
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalEvents: officeHoursEvents.length,
			totalSuccessfulInvites,
			totalFailedInvites,
			totalSkippedInvites,
			requestedBy: requestedBy.email,
		})

		return {
			success: true,
			productId,
			productName: product.name,
			totalPurchasers: purchaseData.data.length,
			totalEvents: officeHoursEvents.length,
			totalSuccessfulInvites,
			totalFailedInvites,
			totalSkippedInvites,
			eventResults,
		}
	},
)

/**
 * Determines if an event is an office hours event based on title or tags
 * Not currently used, but keeping for reference
 */
function isOfficeHoursEvent(event: any): boolean {
	return true
	// Check title for "office hours" keywords
	// const titleLower = event.fields?.title?.toLowerCase() || ''
	// if (
	// 	titleLower.includes('office hours') ||
	// 	titleLower.includes('office hour')
	// ) {
	// 	return true
	// }

	// // Check tags for office hours
	// if (event.tags && Array.isArray(event.tags)) {
	// 	return event.tags.some((tagItem: any) => {
	// 		const tagName = tagItem.tag?.fields?.name?.toLowerCase() || ''
	// 		return tagName.includes('office hours') || tagName.includes('office hour')
	// 	})
	// }

	// return false
}
