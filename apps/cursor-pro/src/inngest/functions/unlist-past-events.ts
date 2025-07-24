import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { EventSchema } from '@/lib/events'
import { log } from '@/server/logger'
import { addMinutes } from 'date-fns'
import { and, eq, lt, ne, sql } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

import { inngest } from '../inngest.server'

/**
 * Utility function to chunk an array into smaller arrays
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize))
	}
	return chunks
}

/**
 * @description Inngest function that runs daily to unlist events that have already ended.
 * Events are considered "past" when their `endsAt` time is more than 30 minutes ago.
 * This prevents users from seeing or purchasing tickets for events that have already occurred.
 */
export const unlistPastEvents = inngest.createFunction(
	{
		id: 'unlist-past-events',
		name: 'Unlist Past Events',
	},
	{
		cron: '0 2 * * *', // Daily at 2 AM UTC (6/7 PM PT depending on DST)
	},
	async ({ event, step }) => {
		await log.info('unlist-past-events.started', {
			executionTime: new Date().toISOString(),
		})

		// Step 1: Find all past events that need to be unlisted
		const pastEvents = await step.run('find-past-events', async () => {
			// Calculate cutoff time: 30 minutes ago from now
			const bufferMinutes = 30
			const cutoffTime = addMinutes(new Date(), -bufferMinutes)

			// Query events that have ended and are not already unlisted
			const events = await db.query.contentResource.findMany({
				where: and(
					eq(contentResource.type, 'event'),
					// Event has ended (endsAt is before cutoff time)
					lt(
						sql`JSON_EXTRACT(${contentResource.fields}, '$.endsAt')`,
						cutoffTime.toISOString(),
					),
					// Event is not already unlisted
					ne(
						sql`JSON_EXTRACT(${contentResource.fields}, '$.visibility')`,
						'unlisted',
					),
					// Only process published events
					eq(
						sql`JSON_EXTRACT(${contentResource.fields}, '$.state')`,
						'published',
					),
				),
			})

			await log.info('unlist-past-events.query-completed', {
				foundEvents: events.length,
				cutoffTime: cutoffTime.toISOString(),
				bufferMinutes,
			})

			// Validate and parse events
			const validEvents = []
			for (const event of events) {
				const validation = EventSchema.safeParse(event)
				if (validation.success) {
					validEvents.push(validation.data)
				} else {
					await log.warn('unlist-past-events.invalid-event-schema', {
						eventId: event.id,
						error: validation.error.message,
					})
				}
			}

			return validEvents
		})

		if (pastEvents.length === 0) {
			await log.info('unlist-past-events.completed', {
				processedEvents: 0,
				message: 'No past events found to unlist',
			})
			return { processedEvents: 0, unlistedEvents: 0 }
		}

		// Step 2: Process events in chunks for better performance and reliability
		const chunks = chunkArray(pastEvents, 50)
		let totalUnlisted = 0

		for (const [index, chunk] of chunks.entries()) {
			const unlistedInChunk = await step.run(
				`process-chunk-${index}`,
				async () => {
					let chunkUnlisted = 0

					for (const event of chunk) {
						try {
							// Double-check the event still needs unlisting (safety check)
							if (event.fields.visibility === 'unlisted') {
								await log.debug('unlist-past-events.already-unlisted', {
									eventId: event.id,
									eventTitle: event.fields.title,
								})
								continue
							}

							// Update the event visibility to unlisted
							await courseBuilderAdapter.updateContentResourceFields({
								id: event.id,
								fields: {
									...event.fields,
									visibility: 'unlisted',
								},
							})

							chunkUnlisted++

							await log.info('unlist-past-events.event-unlisted', {
								eventId: event.id,
								eventTitle: event.fields.title,
								eventEndTime: event.fields.endsAt,
								previousVisibility: event.fields.visibility,
							})
						} catch (error) {
							await log.error('unlist-past-events.update-failed', {
								eventId: event.id,
								eventTitle: event.fields.title,
								error: error instanceof Error ? error.message : String(error),
								stack: error instanceof Error ? error.stack : undefined,
							})

							// Continue processing other events even if one fails
						}
					}

					await log.info('unlist-past-events.chunk-completed', {
						chunkIndex: index,
						chunkSize: chunk.length,
						unlistedInChunk: chunkUnlisted,
					})

					return chunkUnlisted
				},
			)

			totalUnlisted += unlistedInChunk
		}

		// Step 3: Log final results
		await log.info('unlist-past-events.completed', {
			processedEvents: pastEvents.length,
			unlistedEvents: totalUnlisted,
			chunksProcessed: chunks.length,
			executionTime: new Date().toISOString(),
		})

		return {
			processedEvents: pastEvents.length,
			unlistedEvents: totalUnlisted,
			chunksProcessed: chunks.length,
		}
	},
)
