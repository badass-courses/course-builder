import BasicEmail from '@/emails/basic-email'
import { processAllEventInvites } from '@/lib/calendar-invite-utils'
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

		// Step 2: Process all events with rate limiting
		const inviteResults = await step.run('process-all-invites', async () => {
			return await processAllEventInvites({
				productId: product.id,
				addRateLimit: true,
				skipAlreadyInvited: true,
			})
		})

		if (!inviteResults.success) {
			throw new NonRetriableError(inviteResults.message)
		}

		const {
			totalSuccessfulInvites,
			totalFailedInvites,
			totalSkippedInvites,
			details: eventResults,
		} = inviteResults.results

		await log.info('bulk_calendar_invites.processing_completed', {
			productId,
			productName: product.name,
			totalPurchasers: inviteResults.results.totalPurchasers,
			totalEvents: inviteResults.results.totalEvents,
			totalSuccessfulInvites,
			totalFailedInvites,
			totalSkippedInvites,
		})

		// Step 3: Send completion email
		await step.run('send-completion-email', async () => {
			try {
				await sendAnEmail({
					Component: BasicEmail,
					componentProps: {
						body: `# Calendar Invites Complete

The calendar invitation process for **${product.name}** has finished successfully.

## Summary

- ✅ **${inviteResults.results.successfulInvites}** invites sent successfully
- ⏭️ **${inviteResults.results.skippedInvites}** users already invited (skipped)
- ❌ **${inviteResults.results.failedInvites}** invites failed
- 📊 Processed **${inviteResults.results.totalPurchasers}** purchasers across **${inviteResults.results.totalEvents}** events

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
						preview: `Calendar invites complete: ${inviteResults.results.successfulInvites} sent, ${inviteResults.results.skippedInvites} skipped, ${inviteResults.results.failedInvites} failed`,
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
			totalPurchasers: inviteResults.results.totalPurchasers,
			totalEvents: inviteResults.results.totalEvents,
			totalSuccessfulInvites,
			totalFailedInvites,
			totalSkippedInvites,
			requestedBy: requestedBy.email,
		})

		return {
			success: true,
			productId,
			productName: product.name,
			...inviteResults.results,
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
