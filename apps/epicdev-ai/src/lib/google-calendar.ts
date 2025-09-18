import { JWT } from 'google-auth-library'
import { calendar_v3, google } from 'googleapis'

import { env } from '../env.mjs'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

// Cache for authenticated JWT client
let cachedAuthClient: JWT | null = null
let cacheExpiry: number = 0

// Helper function to get authenticated JWT client with caching
function getAuthClient() {
	// Return cached client if still valid
	const now = Date.now()
	if (cachedAuthClient && cacheExpiry > now) {
		return cachedAuthClient
	}

	const rawCredentialsJson = env.GOOG_CREDENTIALS_JSON
	if (!rawCredentialsJson) {
		throw new Error('GOOG_CREDENTIALS_JSON not found in environment.')
	}

	let credentialsJson: string
	if (isBase64(rawCredentialsJson)) {
		try {
			credentialsJson = Buffer.from(rawCredentialsJson, 'base64').toString(
				'utf8',
			)
		} catch (error: any) {
			throw new Error(`Failed to decode Base64 credentials: ${error.message}`)
		}
	} else {
		credentialsJson = rawCredentialsJson
	}

	let credentials
	try {
		credentials = JSON.parse(credentialsJson)
	} catch (error: any) {
		throw new Error(
			`Failed to parse credentials JSON: ${error.message}. Ensure correct format.`,
		)
	}

	if (
		!credentials.client_email ||
		!credentials.private_key ||
		!credentials.project_id
	) {
		throw new Error(
			'Credentials JSON missing required fields (client_email, private_key, project_id).',
		)
	}

	if (!env.GOOG_CALENDAR_IMPERSONATE_USER) {
		throw new Error('GOOG_CALENDAR_IMPERSONATE_USER not configured.')
	}

	console.log(
		`Authenticating GCal as service account: ${credentials.client_email} (impersonating ${env.GOOG_CALENDAR_IMPERSONATE_USER})`,
	)

	cachedAuthClient = new JWT({
		email: credentials.client_email,
		key: credentials.private_key,
		scopes: SCOPES,
		subject: env.GOOG_CALENDAR_IMPERSONATE_USER,
	})

	// Cache for 1 hour
	cacheExpiry = now + 3600000

	return cachedAuthClient
}

// Function to check if a string is likely Base64
function isBase64(str: string): boolean {
	if (!str || str.trim() === '') {
		return false
	}
	try {
		// Attempt to decode and re-encode. If it matches, it's likely Base64.
		// Use Buffer for Node.js environment.
		const buffer = Buffer.from(str, 'base64')
		return buffer.toString('base64') === str
	} catch (err) {
		// If decoding fails, it's not Base64
		return false
	}
}

/**
 * Creates an event on the impersonated user's primary Google Calendar.
 * Reads credentials and impersonation target from environment variables.
 *
 * @param {calendar_v3.Schema$Event} eventDetails The event object to create.
 * @returns {Promise<calendar_v3.Schema$Event>} The created event object.
 * @throws {Error} If authentication or API call fails.
 */
export async function createGoogleCalendarEvent(
	eventDetails: calendar_v3.Schema$Event,
): Promise<calendar_v3.Schema$Event> {
	let authClient
	let calendar
	try {
		authClient = getAuthClient()
		calendar = google.calendar({ version: 'v3', auth: authClient })

		console.log(
			`Attempting to create Google Calendar event: ${eventDetails.summary}`,
		)
		// Log the payload being sent
		console.log(
			'Google Calendar Request Body:',
			JSON.stringify(eventDetails, null, 2),
		)

		const response = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: eventDetails,
		})

		if (!response.data) {
			throw new Error('Google Calendar API returned no data for created event.')
		}

		console.log('SUCCESS! Event created.', { eventId: response.data.id })
		return response.data
	} catch (error: any) {
		console.error('ERROR creating calendar event:', error.message)
		// Log the full error object for more details
		console.error('Full Google API Error Object:', error)
		// Log specific Google API errors if available
		if (error.response?.data?.error) {
			console.error('API Error Details:', error.response.data.error)
			throw new Error(
				`Google Calendar API Error (Create): ${error.response.data.error.message || 'Unknown API error'} (Code: ${error.response.data.error.code})`,
			)
		} else {
			// Rethrow the original error message if no specific API error details found
			throw new Error(`Failed to create calendar event: ${error.message}`)
		}
	}
}

/**
 * Updates an existing event on the impersonated user's primary Google Calendar.
 *
 * @param {string} calendarEventId The ID of the Google Calendar event to update.
 * @param {Partial<calendar_v3.Schema$Event>} eventDetails The event fields to update.
 * @returns {Promise<calendar_v3.Schema$Event | null>} The updated event object, or null if the event was not found (404).
 * @throws {Error} If authentication or API call fails (excluding 404).
 */
export async function updateGoogleCalendarEvent(
	calendarEventId: string,
	eventDetails: calendar_v3.Schema$Event,
): Promise<calendar_v3.Schema$Event | null> {
	if (!calendarEventId) {
		throw new Error('Missing calendarEventId for update.')
	}
	try {
		const authClient = getAuthClient()
		const calendar = google.calendar({ version: 'v3', auth: authClient })

		console.log(
			`Attempting to update Google Calendar event: ${calendarEventId}`,
		)
		const response = await calendar.events.patch({
			calendarId: 'primary',
			eventId: calendarEventId,
			requestBody: eventDetails,
			sendNotifications: false,
		})

		if (!response.data) {
			console.warn(
				`Google Calendar API returned no data for updated event ${calendarEventId}.`,
			)
			return null
		}

		console.log('SUCCESS! Event updated.', { eventId: response.data.id })
		return response.data
	} catch (error: any) {
		if (error.code === 404 || error.response?.status === 404) {
			console.log(
				`Google Calendar event not found during update attempt: ${calendarEventId}`,
			)
			return null
		}

		console.error('ERROR updating calendar event:', error.message)
		if (error.response?.data?.error) {
			console.error('API Error Details:', error.response.data.error)
			throw new Error(
				`Google Calendar API Error (Update): ${error.response.data.error.message || 'Unknown API error'} (Code: ${error.response.data.error.code})`,
			)
		} else {
			throw new Error(`Failed to update calendar event: ${error.message}`)
		}
	}
}

/**
 * Retrieves an event from the impersonated user's primary Google Calendar.
 *
 * @param {string} calendarEventId The ID of the Google Calendar event to retrieve.
 * @returns {Promise<calendar_v3.Schema$Event | null>} The event object or null if not found.
 * @throws {Error} If authentication or API call fails (excluding 404).
 */
export async function getGoogleCalendarEvent(
	calendarEventId: string,
): Promise<calendar_v3.Schema$Event | null> {
	if (!calendarEventId) {
		throw new Error('Missing calendarEventId for get.')
	}
	try {
		const authClient = getAuthClient()
		const calendar = google.calendar({ version: 'v3', auth: authClient })

		console.log(`Getting Google Calendar event: ${calendarEventId}`)
		const response = await calendar.events.get({
			calendarId: 'primary',
			eventId: calendarEventId,
		})

		console.log('SUCCESS! Event retrieved.', { eventId: response.data.id })
		return response.data || null // Return data or null
	} catch (error: any) {
		// Specifically handle 404 (Not Found) by returning null
		if (error.code === 404 || error.response?.status === 404) {
			console.log(`Google Calendar event not found: ${calendarEventId}`)
			return null
		}

		// Log and re-throw other errors
		console.error('ERROR getting calendar event:', error.message)
		if (error.response?.data?.error) {
			console.error('API Error Details:', error.response.data.error)
			throw new Error(
				`Google Calendar API Error (Get): ${error.response.data.error.message || 'Unknown API error'} (Code: ${error.response.data.error.code})`,
			)
		} else {
			throw new Error(`Failed to get calendar event: ${error.message}`)
		}
	}
}

export async function addUserToGoogleCalendarEvent(
	calendarEventId: string,
	userEmail: string,
) {
	const authClient = getAuthClient()
	const calendar = google.calendar({ version: 'v3', auth: authClient })

	const response = await calendar.events.get({
		calendarId: 'primary',
		eventId: calendarEventId,
	})

	const event = response.data

	if (!event) {
		throw new Error('Event not found')
	}

	if (!event.attendees) {
		event.attendees = []
	}

	event.attendees.push({
		email: userEmail,
	})

	return updateGoogleCalendarEvent(calendarEventId, event)
}

/**
 * Gets the list of attendees for a Google Calendar event
 */
export async function getGoogleCalendarEventAttendees(
	calendarEventId: string,
): Promise<Array<{
	email: string
	displayName?: string
	responseStatus?: string
}> | null> {
	if (!calendarEventId) {
		throw new Error('Missing calendarEventId for getting attendees.')
	}

	try {
		const authClient = getAuthClient()
		const calendar = google.calendar({ version: 'v3', auth: authClient })

		console.log(
			`Getting attendees for Google Calendar event: ${calendarEventId}`,
		)
		const response = await calendar.events.get({
			calendarId: 'primary',
			eventId: calendarEventId,
		})

		const event = response.data
		if (!event) {
			console.log(`Google Calendar event not found: ${calendarEventId}`)
			return null
		}

		if (!event.attendees || event.attendees.length === 0) {
			console.log(`No attendees found for event: ${calendarEventId}`)
			return []
		}

		const attendees = event.attendees
			.map((attendee) => ({
				email: attendee.email || '',
				displayName: attendee.displayName || undefined,
				responseStatus: attendee.responseStatus || undefined,
			}))
			.filter((attendee) => attendee.email) // Filter out any attendees without email

		console.log(
			`Found ${attendees.length} attendees for event: ${calendarEventId}`,
		)
		return attendees
	} catch (error: any) {
		// Handle 404 (Not Found) by returning null
		if (error.code === 404 || error.response?.status === 404) {
			console.log(
				`Google Calendar event not found when getting attendees: ${calendarEventId}`,
			)
			return null
		}

		// Log and re-throw other errors
		console.error('ERROR getting calendar event attendees:', error.message)
		if (error.response?.data?.error) {
			console.error('API Error Details:', error.response.data.error)
			throw new Error(
				`Google Calendar API Error (Get Attendees): ${error.response.data.error.message || 'Unknown API error'} (Code: ${error.response.data.error.code})`,
			)
		} else {
			throw new Error(
				`Failed to get calendar event attendees: ${error.message}`,
			)
		}
	}
}

/**
 * Circuit breaker for API resilience
 */
class CircuitBreaker {
	private failures = 0
	private lastFailure = 0
	private state: 'closed' | 'open' | 'half-open' = 'closed'
	private readonly threshold = 3
	private readonly timeout = 60000 // 1 minute

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		if (this.state === 'open') {
			if (Date.now() - this.lastFailure > this.timeout) {
				this.state = 'half-open'
				console.log('Circuit breaker entering half-open state')
			} else {
				throw new Error(
					'Circuit breaker is open - API calls temporarily disabled',
				)
			}
		}

		try {
			const result = await fn()
			if (this.state === 'half-open') {
				this.state = 'closed'
				this.failures = 0
				console.log('Circuit breaker closed - API recovered')
			}
			return result
		} catch (error: any) {
			this.failures++
			this.lastFailure = Date.now()
			if (this.failures >= this.threshold) {
				this.state = 'open'
				console.error(`Circuit breaker opened after ${this.failures} failures`)
			}
			throw error
		}
	}

	reset() {
		this.failures = 0
		this.state = 'closed'
	}
}

const calendarApiCircuitBreaker = new CircuitBreaker()

/**
 * Helper function to update event with retry logic for 503 errors and jitter
 */
async function updateEventWithRetry(
	calendar: calendar_v3.Calendar,
	calendarEventId: string,
	requestBody: any,
	retryCount: number = 0,
	chunkSize?: number,
): Promise<calendar_v3.Schema$Event> {
	const MAX_RETRIES = 5
	const BASE_DELAY = 2000 // 2 seconds

	try {
		// Use circuit breaker to protect against repeated failures
		return await calendarApiCircuitBreaker.execute(async () => {
			const response = await calendar.events.patch({
				calendarId: 'primary',
				eventId: calendarEventId,
				requestBody,
				sendUpdates: 'none',
			})
			return response.data
		})
	} catch (error: any) {
		// Check if it's a rate limit error (429 or 503) and we haven't exceeded retries
		if (
			(error.code === 503 ||
				error.response?.status === 503 ||
				error.code === 429 ||
				error.response?.status === 429) &&
			retryCount < MAX_RETRIES
		) {
			// Exponential backoff with jitter: 2-3s, 4-6s, 8-12s, 16-24s, 32-48s
			const baseDelay = BASE_DELAY * Math.pow(2, retryCount)
			const jitter = Math.random() * baseDelay * 0.5 // Up to 50% jitter
			const delay = baseDelay + jitter

			console.log(
				`Got ${error.code || error.response?.status} error, retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
				chunkSize ? `Chunk size: ${chunkSize}` : '',
				`Message: ${error.message}`,
			)
			await new Promise((resolve) => setTimeout(resolve, delay))
			return updateEventWithRetry(
				calendar,
				calendarEventId,
				requestBody,
				retryCount + 1,
				chunkSize,
			)
		}
		throw error
	}
}

/**
 * Preflight check to test API availability before bulk operations
 */
export async function preflightCheck(
	calendarEventId: string,
): Promise<boolean> {
	try {
		const authClient = getAuthClient()
		const calendar = google.calendar({ version: 'v3', auth: authClient })

		// Try to get the event to test API availability
		const response = await calendar.events.get({
			calendarId: 'primary',
			eventId: calendarEventId,
		})

		if (!response.data) {
			return false
		}

		console.log('Preflight check passed - API is responsive')
		return true
	} catch (error: any) {
		if (error.code === 404 || error.response?.status === 404) {
			console.error('Preflight check failed - Event not found')
		} else {
			console.error(
				'Preflight check failed - API may be throttled:',
				error.message,
			)
		}
		return false
	}
}

/**
 * Bulk adds multiple users to a Google Calendar event
 * Implements adaptive chunking, retry logic, and circuit breaker pattern
 */
export async function bulkAddUsersToGoogleCalendarEvent(
	calendarEventId: string,
	userEmails: string[],
	skipExisting: boolean = true,
): Promise<{
	success: boolean
	addedCount: number
	skippedCount: number
	error?: string
}> {
	if (!calendarEventId || userEmails.length === 0) {
		return {
			success: true,
			addedCount: 0,
			skippedCount: 0,
		}
	}

	// Perform preflight check
	const apiAvailable = await preflightCheck(calendarEventId)
	if (!apiAvailable) {
		return {
			success: false,
			addedCount: 0,
			skippedCount: 0,
			error: 'API preflight check failed - event not found or API unavailable',
		}
	}

	// Conservative approach: 50 per chunk for 2000 invites = ~40 API calls
	// This provides a safety margin and reduces risk of API errors
	let currentChunkSize = 50 // Conservative chunk size
	const MAX_CHUNK_SIZE = 100 // Max 100 to avoid potential API issues
	const MIN_CHUNK_SIZE = 25 // Minimum chunk size for failures

	// Progressive delays to avoid rate limiting
	const calculateDelay = (apiCalls: number) => {
		// Increase delay as we approach the limit
		if (apiCalls > 40) return 8000 // 8s when close to limit
		if (apiCalls > 30) return 5000 // 5s when getting there
		if (apiCalls > 20) return 3000 // 3s in middle
		if (apiCalls > 10) return 2000 // 2s after initial calls
		return 1500 // 1.5s at start
	}

	try {
		const authClient = getAuthClient()
		const calendar = google.calendar({ version: 'v3', auth: authClient })

		// Get the current event with all attendees
		const response = await calendar.events.get({
			calendarId: 'primary',
			eventId: calendarEventId,
		})

		const event = response.data
		if (!event) {
			return {
				success: false,
				addedCount: 0,
				skippedCount: 0,
				error: 'Event not found',
			}
		}

		// Initialize attendees array if it doesn't exist
		if (!event.attendees) {
			event.attendees = []
		}

		// Create a set of existing emails for fast lookup (case-insensitive)
		const existingEmails = new Set(
			event.attendees.map((a) => (a.email || '').toLowerCase()),
		)

		// Track stats
		let totalAddedCount = 0
		let totalSkippedCount = 0

		// Filter out already invited users
		const emailsToAdd: string[] = []
		for (const email of userEmails) {
			const emailLower = email.toLowerCase()

			if (skipExisting && existingEmails.has(emailLower)) {
				totalSkippedCount++
				continue
			}

			emailsToAdd.push(email)
		}

		// If no new emails to add, return early
		if (emailsToAdd.length === 0) {
			console.log(
				`No new attendees to add to event ${calendarEventId} (all ${totalSkippedCount} already invited)`,
			)
			return {
				success: true,
				addedCount: 0,
				skippedCount: totalSkippedCount,
			}
		}

		console.log(
			`Adding ${emailsToAdd.length} new attendees to event ${calendarEventId} with adaptive chunking (starting at ${currentChunkSize})`,
		)

		// Track API call count (you found the limit is ~50 calls)
		const API_CALL_LIMIT = 45 // Conservative limit (actual is 50)
		let apiCallCount = 1 // Already made 1 call to get the event

		// Start with existing attendees
		let currentAttendees = [...event.attendees]
		let remainingEmails = [...emailsToAdd]
		let consecutiveFailures = 0

		// Process with adaptive chunking and API call tracking
		while (remainingEmails.length > 0 && apiCallCount < API_CALL_LIMIT) {
			// Check if we're approaching the API limit
			if (apiCallCount >= API_CALL_LIMIT - 5) {
				console.warn(
					`Approaching API call limit (${apiCallCount}/${API_CALL_LIMIT}). ` +
						`${remainingEmails.length} attendees remaining.`,
				)
			}

			// Create chunk with current size
			const chunk = remainingEmails.slice(0, currentChunkSize)
			const isLastChunk = chunk.length === remainingEmails.length

			console.log(
				`API Call ${apiCallCount + 1}/${API_CALL_LIMIT}: Adding ${chunk.length} attendees`,
				`(${totalAddedCount}/${emailsToAdd.length} completed so far)`,
			)

			// Add chunk to attendees
			const newAttendees = chunk.map((email) => ({ email }))
			const updatedAttendees = [...currentAttendees, ...newAttendees]

			try {
				// Update the event with exponential backoff for 503 errors
				await updateEventWithRetry(
					calendar,
					calendarEventId,
					{
						attendees: updatedAttendees,
					},
					0,
					currentChunkSize,
				)

				// Success! Update state
				currentAttendees = updatedAttendees
				totalAddedCount += chunk.length
				remainingEmails = remainingEmails.slice(currentChunkSize)
				consecutiveFailures = 0 // Reset failure counter
				apiCallCount++ // Increment API call counter

				console.log(
					`✓ Success: Added ${chunk.length} attendees (${totalAddedCount}/${emailsToAdd.length} total, ${apiCallCount}/${API_CALL_LIMIT} API calls used)`,
				)

				// Adapt chunk size - cautiously increase on success (up to max)
				// Only increase after multiple successes to ensure stability
				if (
					currentChunkSize < MAX_CHUNK_SIZE &&
					consecutiveFailures === 0 &&
					totalAddedCount > 100
				) {
					const newSize = Math.min(MAX_CHUNK_SIZE, currentChunkSize + 25) // Increase by 25, not double
					if (newSize !== currentChunkSize) {
						console.log(
							`Cautiously increasing chunk size from ${currentChunkSize} to ${newSize}`,
						)
						currentChunkSize = newSize
					}
				}

				// Add delay based on API call count (not chunk size)
				if (!isLastChunk && remainingEmails.length > 0) {
					const delay = calculateDelay(apiCallCount)
					console.log(`Waiting ${delay}ms before next API call...`)
					await new Promise((resolve) => setTimeout(resolve, delay))
				}
			} catch (error: any) {
				consecutiveFailures++
				console.error(
					`Failed to add chunk (failure ${consecutiveFailures}):`,
					error.message,
				)

				// Check if circuit breaker opened
				if (error.message.includes('Circuit breaker is open')) {
					// Circuit breaker is open, need to wait longer
					console.log(
						'Circuit breaker is open, waiting 60 seconds before retry...',
					)
					await new Promise((resolve) => setTimeout(resolve, 60000))
				}

				// Reduce chunk size after failures to find a working size
				if (consecutiveFailures >= 1) {
					const newSize = Math.max(MIN_CHUNK_SIZE, currentChunkSize - 25) // Reduce by 25
					if (newSize !== currentChunkSize) {
						console.log(
							`Reducing chunk size from ${currentChunkSize} to ${newSize} after ${consecutiveFailures} failure(s)`,
						)
						currentChunkSize = newSize
					}
				}

				// If we've had too many consecutive failures, give up
				if (consecutiveFailures >= 3) {
					// If we've added some attendees, return partial success
					if (totalAddedCount > 0) {
						return {
							success: false,
							addedCount: totalAddedCount,
							skippedCount: totalSkippedCount,
							error: `Partially completed: Added ${totalAddedCount}/${emailsToAdd.length} attendees before repeated failures: ${error.message}`,
						}
					}

					// No attendees added at all
					throw error
				}

				// Add longer delay after failure
				const failureDelay = calculateDelay(currentChunkSize) * 2
				console.log(`Waiting ${failureDelay}ms after failure before retry...`)
				await new Promise((resolve) => setTimeout(resolve, failureDelay))
			}
		}

		// Check if we stopped due to API limit
		if (remainingEmails.length > 0 && apiCallCount >= API_CALL_LIMIT) {
			console.warn(
				`Reached API call limit (${apiCallCount}/${API_CALL_LIMIT}). ` +
					`Added ${totalAddedCount}/${emailsToAdd.length} attendees. ` +
					`${remainingEmails.length} attendees could not be added.`,
			)
			return {
				success: false,
				addedCount: totalAddedCount,
				skippedCount: totalSkippedCount,
				error: `API call limit reached after adding ${totalAddedCount} attendees. ${remainingEmails.length} remaining.`,
			}
		}

		console.log(
			`Successfully added all ${totalAddedCount} attendees to event ${calendarEventId} ` +
				`(${totalSkippedCount} skipped, ${apiCallCount} API calls used)`,
		)

		return {
			success: true,
			addedCount: totalAddedCount,
			skippedCount: totalSkippedCount,
		}
	} catch (error: any) {
		console.error('ERROR bulk adding users to calendar event:', error.message)

		// Check for specific Google API errors
		if (error.response?.data?.error) {
			console.error('API Error Details:', error.response.data.error)
			return {
				success: false,
				addedCount: 0,
				skippedCount: 0,
				error: `Google Calendar API Error: ${error.response.data.error.message || 'Unknown API error'} (Code: ${error.response.data.error.code})`,
			}
		}

		return {
			success: false,
			addedCount: 0,
			skippedCount: 0,
			error: error.message || 'Unknown error',
		}
	}
}

export async function removeUserFromGoogleCalendarEvent(
	calendarEventId: string,
	userEmail: string,
) {
	const authClient = getAuthClient()
	const calendar = google.calendar({ version: 'v3', auth: authClient })

	const response = await calendar.events.get({
		calendarId: 'primary',
		eventId: calendarEventId,
	})

	const event = response.data

	if (!event) {
		// Event not found, so nothing to remove the user from.
		// Optionally, log this, but for now, we'll just return null or handle as appropriate.
		console.warn(
			`Event not found (ID: ${calendarEventId}) when trying to remove user ${userEmail}.`,
		)
		return null
	}

	if (!event.attendees) {
		// No attendees on the event, so the user isn't there to be removed.
		console.warn(
			`No attendees found on event (ID: ${calendarEventId}) when trying to remove user ${userEmail}.`,
		)
		return event // Return the event as is, or null if preferred
	}

	const initialAttendeesCount = event.attendees.length
	event.attendees = event.attendees.filter(
		(attendee) => attendee.email !== userEmail,
	)

	if (event.attendees.length === initialAttendeesCount) {
		// User was not found in the attendees list.
		console.warn(
			`User ${userEmail} not found in attendees for event (ID: ${calendarEventId}). No changes made to attendees.`,
		)
		// Decide if an update is still necessary or if we can return early.
		// For safety, one might proceed with an update if other event properties could have changed,
		// but if only attendees are managed here, and no change was made, we could return.
		// However, the updateGoogleCalendarEvent itself handles `sendNotifications: false`
		// and might have other idempotent properties.
		// For now, let's proceed to update, as it's generally safe.
	}

	// Setting sendNotifications to false is important here to avoid spamming
	// remaining attendees every time someone is removed.
	return updateGoogleCalendarEvent(calendarEventId, {
		...event,
		attendees: event.attendees,
	})
}
