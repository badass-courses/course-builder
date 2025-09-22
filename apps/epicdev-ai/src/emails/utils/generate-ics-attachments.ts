/**
 * Represents a single office hours event with timing and link information
 */
export interface OfficeHoursEvent {
	startTime: string // Human readable time like "8:30 AM (PDT)"
	endTime: string // Human readable time like "9:30 AM (PDT)"
	isoStartDate: string // ISO 8601 date string for start
	isoEndDate: string // ISO 8601 date string for end
	liveLink: string // URL to the live stream
}

/**
 * Represents a day containing office hours events
 */
export interface OfficeHoursDay {
	date: string // Human readable date like "September 22nd, 2025"
	events: OfficeHoursEvent[]
}

/**
 * Generates a unique identifier for ICS events
 */
function generateUID(): string {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2, 9)
	return `${timestamp}-${random}@epicdev.ai`
}

/**
 * Formats a date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(isoDate: string): string {
	return new Date(isoDate)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')
}

/**
 * Escapes special characters in ICS text fields
 */
function escapeICSText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
}

/**
 * Creates an ICS file content for a single office hours event
 */
function createICSContent(
	event: OfficeHoursEvent,
	title: string,
	dayDate: string,
): string {
	const uid = generateUID()
	const dtstamp = formatICSDate(new Date().toISOString())
	const dtstart = formatICSDate(event.isoStartDate)
	const dtend = formatICSDate(event.isoEndDate)

	const summary = `${title} - Office Hours (${event.startTime})`
	const description = `Join the office hours session for ${title} on ${dayDate}.\n\nLive Stream Link: ${event.liveLink}\n\nTime: ${event.startTime} - ${event.endTime}`

	const icsContent = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Epic Dev AI//Office Hours//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:REQUEST',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${dtstamp}`,
		`DTSTART:${dtstart}`,
		`DTEND:${dtend}`,
		`SUMMARY:${escapeICSText(summary)}`,
		`DESCRIPTION:${escapeICSText(description)}`,
		`LOCATION:${event.liveLink}`,
		'STATUS:CONFIRMED',
		'SEQUENCE:0',
		'BEGIN:VALARM',
		'TRIGGER:-PT15M',
		'ACTION:DISPLAY',
		`DESCRIPTION:Office hours starting in 15 minutes`,
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR',
	].join('\r\n')

	return icsContent
}

/**
 * Generates ICS attachments for all office hours events
 *
 * @param days Array of office hours days containing events
 * @param eventTitle Optional title for the events (defaults to "Office Hours")
 * @returns Array of attachment objects compatible with Postmark/react-email
 */
export function generateICSAttachments(
	days: OfficeHoursDay[],
	eventTitle: string = 'Office Hours',
): Array<{
	Name: string
	Content: string
	ContentType: string
}> {
	const attachments: Array<{
		Name: string
		Content: string
		ContentType: string
	}> = []

	days.forEach((day) => {
		day.events.forEach((event) => {
			// Parse the ISO date to get month, day, year
			const eventDate = new Date(event.isoStartDate)
			const month = String(eventDate.getMonth() + 1).padStart(2, '0')
			const dayNum = String(eventDate.getDate()).padStart(2, '0')
			const year = String(eventDate.getFullYear()).slice(-2)

			// Create short filename: YY-MM-DD-morning/evening.ics
			const timeSlug = event.startTime.includes('AM') ? 'morning' : 'evening'
			const filename = `${year}-${month}-${dayNum}-${timeSlug}.ics`

			// Generate the ICS content
			const icsContent = createICSContent(event, eventTitle, day.date)

			// Convert to base64 for email attachment
			const base64Content = Buffer.from(icsContent).toString('base64')

			attachments.push({
				Name: filename,
				Content: base64Content,
				ContentType: 'text/calendar; charset=utf-8; method=REQUEST',
			})
		})
	})

	return attachments
}
