import BasicEmail from '@/emails/basic-email'
import {
	getOfficeHoursAndPurchaseData,
	processAllEventInvites,
	processSingleEventInvites,
} from '@/lib/calendar-invite-utils'
import { getProduct } from '@/lib/products-query'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { NonRetriableError } from 'inngest'

import {
	BULK_CALENDAR_INVITE_EVENT,
	type BulkCalendarInviteSent,
} from '../events/bulk-calendar-invites'
import { inngest } from '../inngest.server'

/**
 * Background job to process bulk calendar invites for a cohort product
 */
// export const processBulkCalendarInvites = inngest.createFunction(
// 	{
// 		id: 'process-bulk-calendar-invites',
// 		name: 'Process Bulk Calendar Invites',
// 	},
// 	{ event: BULK_CALENDAR_INVITE_EVENT },
// 	async ({ event, step }: { event: BulkCalendarInviteSent; step: any }) => {
// 		const { productId, requestedBy } = event.data

// 		await log.info('bulk_calendar_invites.started', {
// 			productId,
// 			requestedBy: requestedBy.email,
// 		})

// 		// Step 1: Get and validate product
// 		const product = await step.run('get-product', async () => {
// 			const p = await getProduct(productId)
// 			if (!p) {
// 				throw new NonRetriableError(`Product not found: ${productId}`)
// 			}
// 			if (p.type !== 'cohort') {
// 				throw new NonRetriableError(`Product is not a cohort type: ${p.type}`)
// 			}
// 			return p
// 		})

// 		// Step 2: Process all events with rate limiting
// 		const inviteResults = await step.run('process-all-invites', async () => {
// 			return await processAllEventInvites({
// 				productId: product.id,
// 				addRateLimit: true,
// 				skipAlreadyInvited: true,
// 			})
// 		})

// 		if (!inviteResults.success) {
// 			throw new NonRetriableError(inviteResults.message)
// 		}

// 		const {
// 			totalSuccessfulInvites,
// 			totalFailedInvites,
// 			totalSkippedInvites,
// 			details: eventResults,
// 		} = inviteResults.results

// 		await log.info('bulk_calendar_invites.processing_completed', {
// 			productId,
// 			productName: product.name,
// 			totalPurchasers: inviteResults.results.totalPurchasers,
// 			totalEvents: inviteResults.results.totalEvents,
// 			totalSuccessfulInvites,
// 			totalFailedInvites,
// 			totalSkippedInvites,
// 		})

// 		// Step 3: Send completion email
// 		await step.run('send-completion-email', async () => {
// 			try {
// 				await sendAnEmail({
// 					Component: BasicEmail,
// 					componentProps: {
// 						body: `# Calendar Invites Complete

// The calendar invitation process for **${product.name}** has finished successfully.

// ## Summary

// - ✅ **${inviteResults.results.successfulInvites}** invites sent successfully
// - ⏭️ **${inviteResults.results.skippedInvites}** users already invited (skipped)
// - ❌ **${inviteResults.results.failedInvites}** invites failed
// - 📊 Processed **${inviteResults.results.totalPurchasers}** purchasers across **${inviteResults.results.totalEvents}** events

// ## Event Details

// ${eventResults
// 	.map(
// 		(e: any) =>
// 			`### ${e.eventTitle}
// - **${e.totalSuccessful}** sent
// - **${e.totalSkipped}** skipped
// - **${e.totalFailed}** failed`,
// 	)
// 	.join('\n\n')}

// ---

// *Requested by: ${requestedBy.email}*`,
// 						preview: `Calendar invites complete: ${inviteResults.results.successfulInvites} sent, ${inviteResults.results.skippedInvites} skipped, ${inviteResults.results.failedInvites} failed`,
// 						messageType: 'transactional',
// 					},
// 					Subject: `✅ Calendar Invites Complete: ${product.name}`,
// 					To: requestedBy.email,
// 					type: 'transactional',
// 				})
// 			} catch (error) {
// 				await log.error('bulk_calendar_invites.email_failed', {
// 					productId,
// 					productName: product.name,
// 					requestedBy: requestedBy.email,
// 					error: error instanceof Error ? error.message : 'Unknown error',
// 					stack: error instanceof Error ? error.stack : undefined,
// 				})
// 				// Don't rethrow - let the step complete even if email fails
// 			}
// 		})

// 		await log.info('bulk_calendar_invites.completed', {
// 			productId,
// 			productName: product.name,
// 			totalPurchasers: inviteResults.results.totalPurchasers,
// 			totalEvents: inviteResults.results.totalEvents,
// 			totalSuccessfulInvites,
// 			totalFailedInvites,
// 			totalSkippedInvites,
// 			requestedBy: requestedBy.email,
// 		})

// 		return {
// 			success: true,
// 			productId,
// 			productName: product.name,
// 			...inviteResults.results,
// 		}
// 	},
// )

/**
 * Background job to process bulk calendar invites for a cohort product
 * V2: Processes each event in a separate step to avoid timeouts
 */

export const processBulkCalendarInvites = inngest.createFunction(
	{
		id: 'process-bulk-calendar-invites',
		name: 'Process Bulk Calendar Invites V2',
	},
	{ event: BULK_CALENDAR_INVITE_EVENT },
	async ({ event, step }: { event: BulkCalendarInviteSent; step: any }) => {
		const { productId, requestedBy } = event.data

		await log.info('bulk_calendar_invites_v2.started', {
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

		// Step 2: Get office hours events and purchase data
		const { officeHoursEvents, purchasers, success, message } = await step.run(
			'get-office-hours-and-purchase-data',
			async () => {
				const data = await getOfficeHoursAndPurchaseData({ productId })

				if (!data.success) {
					await log.warn('bulk_calendar_invites_v2.no_data', {
						productId,
						message: data.message,
					})
				}

				return data
			},
		)

		// Early return if no data
		if (!success || officeHoursEvents.length === 0 || purchasers.length === 0) {
			await log.info('bulk_calendar_invites_v2.early_return', {
				productId,
				message: message || 'No events or purchasers found',
			})

			// Send notification email about no data
			await step.run('send-no-data-email', async () => {
				try {
					await sendAnEmail({
						Component: BasicEmail,
						componentProps: {
							body: `# Calendar Invites Not Processed

The calendar invitation process for **${product.name}** could not proceed.

## Reason
${message || 'No office hours events or purchasers found for this product.'}

---

*Requested by: ${requestedBy.email}*`,
							preview: `Calendar invites not processed: ${message}`,
							messageType: 'transactional',
						},
						Subject: `⚠️ Calendar Invites Not Processed: ${product.name}`,
						To: requestedBy.email,
						type: 'transactional',
					})
				} catch (error) {
					await log.error('bulk_calendar_invites_v2.no_data_email_failed', {
						productId,
						error: error instanceof Error ? error.message : 'Unknown error',
					})
				}
			})

			return {
				success: false,
				productId,
				productName: product.name,
				message,
			}
		}

		// Step 3: Process each event individually
		const eventResults: Array<{
			eventId: string
			eventTitle: string
			eventType: string
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
			error?: string
		}> = []
		let totalSuccessfulInvites = 0
		let totalFailedInvites = 0
		let totalSkippedInvites = 0

		for (let i = 0; i < officeHoursEvents.length; i++) {
			const event = officeHoursEvents[i]
			const eventTitle = event.fields?.title || `Event ${i + 1}`

			try {
				const eventResult = await step.run(
					`process-event-${i + 1}-${event.id}`,
					async () => {
						await log.info('bulk_calendar_invites_v2.processing_event', {
							productId,
							eventId: event.id,
							eventTitle,
							eventIndex: i + 1,
							totalEvents: officeHoursEvents.length,
						})

						const result = await processSingleEventInvites({
							event,
							purchasers,
							skipAlreadyInvited: true,
							addRateLimit: false, // No rate limit needed with bulk mode
							useBulkMode: true, // Use bulk mode to avoid rate limits
						})

						await log.info('bulk_calendar_invites_v2.event_processed', {
							productId,
							eventId: event.id,
							eventTitle: result.eventTitle,
							successful: result.totalSuccessful,
							failed: result.totalFailed,
							skipped: result.totalSkipped,
						})

						return result
					},
				)

				eventResults.push(eventResult)
				totalSuccessfulInvites += eventResult.totalSuccessful
				totalFailedInvites += eventResult.totalFailed
				totalSkippedInvites += eventResult.totalSkipped
			} catch (error) {
				// Log error but continue processing other events
				await log.error('bulk_calendar_invites_v2.event_failed', {
					productId,
					eventId: event.id,
					eventTitle,
					error: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
				})

				// Add a failed result for this event
				eventResults.push({
					eventId: event.id,
					eventTitle,
					eventType: event.type,
					calendarEvents: [],
					totalSuccessful: 0,
					totalFailed: 0,
					totalSkipped: 0,
					error: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		}

		await log.info('bulk_calendar_invites_v2.processing_completed', {
			productId,
			productName: product.name,
			totalPurchasers: purchasers.length,
			totalEvents: officeHoursEvents.length,
			totalSuccessfulInvites,
			totalFailedInvites,
			totalSkippedInvites,
		})

		// Step 4: Send completion email
		await step.run('send-completion-email', async () => {
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
- 📊 Processed **${purchasers.length}** purchasers across **${officeHoursEvents.length}** events

## Event Details

${eventResults
	.map(
		(e: any) =>
			`### ${e.eventTitle}
${e.error ? `⚠️ **Error:** ${e.error}` : ''}
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
				await log.error('bulk_calendar_invites_v2.email_failed', {
					productId,
					productName: product.name,
					requestedBy: requestedBy.email,
					error: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
				})
				// Don't rethrow - let the step complete even if email fails
			}
		})

		await log.info('bulk_calendar_invites_v2.completed', {
			productId,
			productName: product.name,
			totalPurchasers: purchasers.length,
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
			totalPurchasers: purchasers.length,
			totalEvents: officeHoursEvents.length,
			successfulInvites: totalSuccessfulInvites,
			failedInvites: totalFailedInvites,
			skippedInvites: totalSkippedInvites,
			details: eventResults,
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
