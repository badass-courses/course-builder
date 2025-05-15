import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { EventSchema, type Event } from '@/lib/events'
import {
	createGoogleCalendarEvent,
	getGoogleCalendarEvent,
	updateGoogleCalendarEvent,
} from '@/lib/google-calendar'
import { calendar_v3 } from 'googleapis'
import { GetFunctionInput, NonRetriableError } from 'inngest'

import {
	RESOURCE_CREATED_EVENT,
	RESOURCE_UPDATED_EVENT,
} from '../events/resource-management'
import { inngest } from '../inngest.server'

/**
 * Maps the fields from our Event resource to the Google Calendar API format.
 *
 * @param {Event} eventResource The event resource from our database.
 * @returns {calendar_v3.Schema$Event | null} Google Calendar event payload or null if required fields are missing.
 */
function mapResourceToGoogleEvent(
	eventResource: Event,
): Partial<calendar_v3.Schema$Event> | null {
	const fields = eventResource.fields

	if (!fields.startsAt) {
		console.warn(
			`Event resource ${eventResource.id} is missing startsAt, cannot create/update Google Calendar event.`,
		)
		return null // Cannot create an event without a start time
	}

	// Google Calendar API requires both start and end times.
	// If endsAt is missing, maybe default to 1 hour duration?
	// For now, let's require it for simplicity, but this could be adjusted.
	if (!fields.endsAt) {
		console.warn(
			`Event resource ${eventResource.id} is missing endsAt, cannot create/update Google Calendar event.`,
		)
		return null
	}

	const timezone = fields.timezone || 'America/Los_Angeles' // Default timezone if not set

	return {
		summary: fields.title,
		description: fields.details || fields.body || fields.description || '', // Use details, body, fallback to description
		start: {
			dateTime: fields.startsAt,
			timeZone: timezone,
		},
		end: {
			dateTime: fields.endsAt,
			timeZone: timezone,
		},
		guestsCanInviteOthers: false,
		guestsCanSeeOtherGuests: false,
		// Consider adding other fields like location if available/needed
	}
}

export const calendarSync = inngest.createFunction(
	// Argument 1: Function Config
	{
		id: 'calendar-sync',
		name: 'Google Calendar Sync for Events',
	},
	// Argument 2: Trigger Config
	[
		{ event: RESOURCE_CREATED_EVENT, if: "event.data.type == 'event'" },
		{ event: RESOURCE_UPDATED_EVENT, if: "event.data.type == 'event'" },
	],
	// Argument 3: Handler Function with explicit event type union
	async ({ event, step }) => {
		const resourceId = event.data.id
		console.log(
			`Received event for resource: ${resourceId} (event name: ${event.name})`,
		)

		// Step 1: Fetch the full resource details
		const eventResource = await step.run('fetch-event-resource', async () => {
			return await courseBuilderAdapter.getContentResource(resourceId)
		})

		if (!eventResource) {
			// If the resource doesn't exist shortly after the event, it likely won't appear later.
			throw new NonRetriableError(`Event resource not found: ${resourceId}`)
		}

		// Step 2: Validate the resource schema
		const validation = EventSchema.safeParse(eventResource)
		if (!validation.success) {
			console.error('Schema Validation Error:', validation.error)
			throw new NonRetriableError(
				`Invalid event resource format for ${resourceId}: ${validation.error.message}`,
			)
		}
		const validEventResource = validation.data

		// Step 3: Check prerequisite environment variables
		if (!env.GOOG_CALENDAR_IMPERSONATE_USER) {
			throw new Error('GOOG_CALENDAR_IMPERSONATE_USER not configured.') // Retriable, maybe env var is temporarily missing
		}
		if (!env.GOOG_CREDENTIALS_JSON) {
			throw new Error('GOOG_CREDENTIALS_JSON not configured.') // Retriable
		}

		// Step 4: Map resource fields to Google Calendar Event payload
		const partialGoogleEventPayload =
			mapResourceToGoogleEvent(validEventResource)

		if (!partialGoogleEventPayload) {
			// Required fields (like startsAt) were missing.
			console.log(
				`Skipping Google Calendar sync for ${resourceId} due to missing required fields.`,
			)
			return { skipped: true, reason: 'Missing required fields' }
		}

		let currentCalendarId = validEventResource.fields.calendarId
		let outcome: 'created' | 'updated' | 'skipped' = 'skipped'
		let finalCalendarId: string | null = currentCalendarId || null
		let requiresCreation = !currentCalendarId

		// Step 5a: Check and attempt update if calendarId exists
		if (currentCalendarId) {
			console.log(
				`Checking existing Google Calendar event ${currentCalendarId} for resource ${resourceId}`,
			)
			let existingGoogleEvent: calendar_v3.Schema$Event | null = null
			try {
				existingGoogleEvent = await step.run('get-google-event', async () => {
					return await getGoogleCalendarEvent(currentCalendarId!)
				})
			} catch (error: any) {
				console.error(`Failed to get Google event ${currentCalendarId}:`, error)
				// If get fails for reasons other than 404 (already handled in lib), let it retry
				throw error
			}

			if (!existingGoogleEvent || existingGoogleEvent.status === 'cancelled') {
				// Event doesn't exist on Google's side or is cancelled
				console.log(
					`Google Calendar event ${currentCalendarId} not found or cancelled. Will attempt to create a new one.`,
				)
				requiresCreation = true // Mark for creation
				finalCalendarId = null // Clear the stale ID
			} else {
				// Event exists and is not cancelled, proceed with update
				console.log(
					`Attempting update for existing Google Calendar event ${currentCalendarId}`,
				)
				try {
					const updatedEvent = await step.run(
						'update-google-event',
						async () => {
							return await updateGoogleCalendarEvent(
								currentCalendarId!,
								partialGoogleEventPayload,
							)
						},
					)

					if (updatedEvent) {
						console.log(
							`Successfully updated Google Calendar event ${currentCalendarId}`,
						)
						outcome = 'updated'
						// finalCalendarId remains currentCalendarId
					} else {
						// Update returned null (404 Not Found), which is unexpected after a successful get
						// Log it and proceed to create, just in case of race conditions or weirdness
						console.warn(
							`Update failed (404) for Google Calendar event ${currentCalendarId} immediately after get succeeded. Proceeding to create.`,
						)
						requiresCreation = true
						finalCalendarId = null
					}
				} catch (error: any) {
					console.error(
						`Failed to update Google event ${currentCalendarId}:`,
						error,
					)
					throw error // Allow retries for other update errors
				}
			}
		}

		// Step 5b: Create if needed
		if (requiresCreation) {
			// TODO: If creating a new event because the old one was cancelled/deleted,
			// any existing attendees from the old event need to be re-added.
			// This requires fetching attendees from the old event (if possible via API even when cancelled)
			// or storing attendee info alongside our resource.
			console.log(
				`Creating new Google Calendar event for resource ${resourceId}`,
			)

			if (
				!partialGoogleEventPayload.summary ||
				!partialGoogleEventPayload.start ||
				!partialGoogleEventPayload.end
			) {
				throw new NonRetriableError(
					`Mapped payload is missing essential fields (summary, start, end) for resource ${resourceId}`,
				)
			}
			const googleEventPayload =
				partialGoogleEventPayload as calendar_v3.Schema$Event

			let createdGoogleEvent: calendar_v3.Schema$Event | null = null
			try {
				createdGoogleEvent = await step.run('create-google-event', async () => {
					return await createGoogleCalendarEvent(googleEventPayload)
				})

				if (createdGoogleEvent?.id) {
					outcome = 'created'
					finalCalendarId = createdGoogleEvent.id
				} else {
					console.error(
						`Google event created for ${resourceId}, but no ID was returned.`,
					)
					throw new NonRetriableError(
						'Google event created but ID missing from response.',
					)
				}
			} catch (error: any) {
				console.error(`Failed to create Google event for ${resourceId}:`, error)
				throw error // Allow retries
			}
		}

		// Step 5c: Update our resource with the new/final Google Calendar ID if it changed
		if (
			finalCalendarId &&
			finalCalendarId !== validEventResource.fields.calendarId
		) {
			console.log(
				`Updating resource ${resourceId} with final calendar ID ${finalCalendarId}`,
			)
			try {
				await step.run('update-resource-with-calendar-id', async () => {
					await courseBuilderAdapter.updateContentResourceFields({
						id: validEventResource.id,
						fields: {
							...validEventResource.fields,
							calendarId: finalCalendarId,
						},
					})
				})
			} catch (error: any) {
				console.error(
					`Failed to update resource ${resourceId} with calendar ID ${finalCalendarId}:`,
					error,
				)
				// If DB update fails after successful GCal operation, let it retry.
				throw error
			}
		}

		return { outcome: outcome, calendarId: finalCalendarId }
	},
)
