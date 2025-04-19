import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { EventSchema, type Event } from '@/lib/events'
import {
	createGoogleCalendarEvent,
	updateGoogleCalendarEvent,
} from '@/lib/google-calendar'
import { calendar_v3 } from 'googleapis'
import { GetFunctionInput, NonRetriableError } from 'inngest'

import {
	RESOURCE_CREATED_EVENT,
	RESOURCE_UPDATED_EVENT,
	type ResourceCreated,
	type ResourceUpdated,
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
	async ({
		event,
		step,
	}: {
		event: ResourceCreated | ResourceUpdated // Explicit union type for the event
		step: any // Use 'any' for step for now, or import Step type if needed
	}) => {
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
		const googleEventPayload = mapResourceToGoogleEvent(validEventResource)

		if (!googleEventPayload) {
			// Required fields (like startsAt) were missing.
			console.log(
				`Skipping Google Calendar sync for ${resourceId} due to missing required fields.`,
			)
			return { skipped: true, reason: 'Missing required fields' }
		}

		const calendarId = validEventResource.fields.calendarId

		if (calendarId) {
			// Step 5a: Update existing Google Calendar event
			console.log(
				`Updating existing Google Calendar event ${calendarId} for resource ${resourceId}`,
			)
			try {
				await step.run('update-google-event', async () => {
					await updateGoogleCalendarEvent(calendarId, googleEventPayload)
				})
				return { outcome: 'updated', calendarId }
			} catch (error: any) {
				console.error(`Failed to update Google event ${calendarId}:`, error)
				// Consider if specific errors should be non-retriable (e.g., 404 Not Found means we should maybe create?)
				// For now, let Inngest handle retries based on the error thrown by the lib function.
				throw error
			}
		} else {
			// Step 5b: Create new Google Calendar event
			console.log(
				`Creating new Google Calendar event for resource ${resourceId}`,
			)
			let createdGoogleEvent: calendar_v3.Schema$Event | null = null
			try {
				createdGoogleEvent = await step.run('create-google-event', async () => {
					// Ensure the payload passed is not partial
					return await createGoogleCalendarEvent(
						googleEventPayload as calendar_v3.Schema$Event,
					)
				})
			} catch (error: any) {
				console.error(`Failed to create Google event for ${resourceId}:`, error)
				throw error // Allow retries
			}

			// Step 5c: Update our resource with the new Google Calendar ID
			if (createdGoogleEvent?.id) {
				const newCalendarId = createdGoogleEvent.id
				console.log(
					`Updating resource ${resourceId} with new calendar ID ${newCalendarId}`,
				)
				try {
					await step.run('update-resource-with-calendar-id', async () => {
						await courseBuilderAdapter.updateContentResourceFields({
							id: validEventResource.id,
							fields: {
								...validEventResource.fields,
								calendarId: newCalendarId,
							},
						})
					})
					return { outcome: 'created', calendarId: newCalendarId }
				} catch (error: any) {
					console.error(
						`Failed to update resource ${resourceId} with calendar ID ${newCalendarId}:`,
						error,
					)
					// This is tricky. The Google event exists, but our DB link failed.
					// Maybe schedule a follow-up event? For now, let it retry.
					throw error
				}
			} else {
				// This shouldn't happen if createGoogleCalendarEvent succeeded without error
				console.error(
					`Google event created for ${resourceId}, but no ID was returned.`,
				)
				throw new NonRetriableError(
					'Google event created but ID missing from response.',
				)
			}
		}
	},
)
