// Script to test the Google Calendar library function

import { calendar_v3 } from 'googleapis'

import { createGoogleCalendarEvent } from '../lib/google-calendar' // Import the library function

// --- Configuration ---
const USER_TO_IMPERSONATE = 'team@epicai.pro' // The user whose calendar we'll modify

async function runTest() {
	console.log(`--- Starting Google Calendar Test Script ---`)

	// 1. Define the Test Event Details
	const eventStartTime = new Date()
	eventStartTime.setDate(eventStartTime.getDate() + 1) // Tomorrow
	eventStartTime.setHours(10, 0, 0, 0) // 10:00 AM

	const eventEndTime = new Date(eventStartTime.getTime())
	eventEndTime.setHours(eventStartTime.getHours() + 1) // 1 hour duration

	const event: calendar_v3.Schema$Event = {
		summary: 'Test Event from Library Function',
		description: `This is a test event created via the library function at ${new Date().toISOString()}`,
		start: {
			dateTime: eventStartTime.toISOString(),
			timeZone: 'America/Los_Angeles', // Specify a timezone
		},
		end: {
			dateTime: eventEndTime.toISOString(),
			timeZone: 'America/Los_Angeles', // Specify a timezone
		},
	}

	// 2. Call the Library Function to Create the Event
	try {
		console.log(
			`Calling createGoogleCalendarEvent for ${USER_TO_IMPERSONATE}...`,
		)
		const createdEvent = await createGoogleCalendarEvent(
			USER_TO_IMPERSONATE,
			event,
		)

		console.log('------------------------------------------------------')
		console.log('SCRIPT SUCCESS! Event created via library function.')
		console.log('Event Summary:', createdEvent.summary)
		console.log('Event Start:', createdEvent.start?.dateTime)
		console.log('Event Link:', createdEvent.htmlLink)
		console.log('------------------------------------------------------')
	} catch (error: any) {
		console.error('------------------------------------------------------')
		console.error(
			'SCRIPT ERROR: Failed to create event using library function:',
		)
		console.error('Error Message:', error.message)
		// Log the full error if needed for more details, library function already logged specifics
		// console.error('Full Error:', error);
		console.error('------------------------------------------------------')
	}

	console.log(`--- Google Calendar Test Script Finished ---`)
}

// Run the test function
runTest()
