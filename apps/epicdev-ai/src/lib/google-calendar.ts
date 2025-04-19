import { JWT } from 'google-auth-library'
import { calendar_v3, google } from 'googleapis'

import { env } from '../env.mjs'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

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
 * Creates an event on a Google Calendar using service account impersonation.
 * Reads credentials from the GOOGLE_CREDENTIALS_JSON environment variable,
 * which can be either raw JSON or Base64 encoded JSON.
 *
 * @param {string} userToImpersonate The email address of the user whose calendar to modify.
 * @param {calendar_v3.Schema$Event} eventDetails The event object to create. See Google Calendar API docs.
 * @returns {Promise<calendar_v3.Schema$Event>} The created event object.
 * @throws {Error} If credentials are not found, invalid, or if the API call fails.
 */
export async function createGoogleCalendarEvent(
	userToImpersonate: string,
	eventDetails: calendar_v3.Schema$Event,
): Promise<calendar_v3.Schema$Event> {
	console.log(
		`Attempting Google Calendar API call for user: ${userToImpersonate}`,
	)

	// 1. Load Credentials from Validated Environment
	const rawCredentialsJson = env.GOOGLE_CREDENTIALS_JSON

	let credentialsJson: string
	if (isBase64(rawCredentialsJson)) {
		console.log('Decoding Base64 encoded Google credentials...')
		try {
			credentialsJson = Buffer.from(rawCredentialsJson, 'base64').toString(
				'utf8',
			)
		} catch (error: any) {
			console.error('Base64 Decoding Error:', error)
			throw new Error(`Failed to decode Base64 credentials: ${error.message}`)
		}
	} else {
		console.log(
			'Using raw Google credentials string from environment variable.',
		)
		credentialsJson = rawCredentialsJson // Assume it's raw JSON
	}

	let credentials
	try {
		credentials = JSON.parse(credentialsJson)
	} catch (error: any) {
		console.error('Credentials Parsing Error:', error)
		throw new Error(
			`Failed to parse credentials JSON: ${error.message}. Ensure the environment variable contains valid JSON (or valid Base64 encoded JSON).`,
		)
	}

	// Check for essential credential properties
	if (
		!credentials.client_email ||
		!credentials.private_key ||
		!credentials.project_id
	) {
		throw new Error(
			'Credentials JSON is missing required fields (client_email, private_key, project_id).',
		)
	}

	console.log(
		`Authenticating as service account: ${credentials.client_email} (impersonating ${userToImpersonate})`,
	)

	// 2. Create JWT Auth Client with Impersonation
	const authClient = new JWT({
		email: credentials.client_email,
		key: credentials.private_key, // The key format should be correct now after JSON parsing
		scopes: SCOPES,
		subject: userToImpersonate,
	})

	// 3. Initialize Google Calendar API Client
	const calendar = google.calendar({ version: 'v3', auth: authClient })

	// 4. Insert the Event
	try {
		console.log(`Creating event on primary calendar of ${userToImpersonate}...`)
		const response = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: eventDetails,
		})

		if (!response.data) {
			throw new Error('Google Calendar API returned no data for created event.')
		}

		console.log('SUCCESS! Event created via library function.')
		return response.data
	} catch (error: any) {
		console.error('------------------------------------------------------')
		console.error('ERROR creating calendar event via library function:')
		// Log specific Google API errors if available
		if (error.response?.data?.error) {
			console.error('API Error Details:', error.response.data.error)
			throw new Error(
				`Google Calendar API Error: ${error.response.data.error.message || 'Unknown API error'} (Code: ${error.response.data.error.code})`,
			)
		} else {
			console.error('Full Error:', error.message || error)
			throw new Error(
				`Failed to create calendar event: ${error.message || 'Unknown error'}`,
			)
		}
	}
}
