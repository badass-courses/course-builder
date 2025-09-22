/**
 * Generates calendar links for various providers (Google, Yahoo, Outlook, iCalendar)
 */

import type { OfficeHoursEvent } from './generate-ics-attachments'

/**
 * Encodes text for use in URLs
 */
function encodeURIComponentSafe(str: string): string {
	return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase()
	})
}

/**
 * Formats date for calendar URLs (YYYYMMDDTHHmmSSZ)
 */
function formatDateForCalendarURL(isoDate: string): string {
	return new Date(isoDate)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')
}

/**
 * Generates a Google Calendar link
 */
export function generateGoogleCalendarLink(
	event: OfficeHoursEvent,
	title: string,
	dayDate: string,
): string {
	// For Google Calendar, keep the 'Z' suffix to indicate UTC times
	// Google will automatically convert to user's local timezone
	const startDate = formatDateForCalendarURL(event.isoStartDate)
	const endDate = formatDateForCalendarURL(event.isoEndDate)
	const text = `${title} - Office Hours (${event.startTime})`
	const details = `Join the office hours session for ${title} on ${dayDate}.\n\nLive Stream Link: ${event.liveLink}\n\nTime: ${event.startTime} - ${event.endTime}`

	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: text,
		dates: `${startDate}/${endDate}`,
		details: details,
		location: event.liveLink,
	})

	return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates a Yahoo Calendar link
 */
export function generateYahooCalendarLink(
	event: OfficeHoursEvent,
	title: string,
	dayDate: string,
): string {
	const startDate = formatDateForCalendarURL(event.isoStartDate)
	const endDate = formatDateForCalendarURL(event.isoEndDate)
	const eventTitle = `${title} - Office Hours (${event.startTime})`
	const desc = `Join the office hours session for ${title} on ${dayDate}.\n\nLive Stream Link: ${event.liveLink}\n\nTime: ${event.startTime} - ${event.endTime}`

	const params = new URLSearchParams({
		v: '60',
		title: eventTitle,
		st: startDate,
		et: endDate,
		desc: desc,
		in_loc: event.liveLink,
	})

	return `https://calendar.yahoo.com/?${params.toString()}`
}

/**
 * Generates an Outlook.com calendar link
 */
export function generateOutlookCalendarLink(
	event: OfficeHoursEvent,
	title: string,
	dayDate: string,
): string {
	const startDate = new Date(event.isoStartDate).toISOString()
	const endDate = new Date(event.isoEndDate).toISOString()
	const subject = `${title} - Office Hours (${event.startTime})`
	const body = `Join the office hours session for ${title} on ${dayDate}.<br><br>Live Stream Link: ${event.liveLink}<br><br>Time: ${event.startTime} - ${event.endTime}`

	const params = new URLSearchParams({
		path: '/calendar/action/compose',
		rru: 'addevent',
		startdt: startDate,
		enddt: endDate,
		subject: subject,
		body: body,
		location: event.liveLink,
	})

	return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generates a data URI for downloading an ICS file
 */
export function generateICalendarLink(
	event: OfficeHoursEvent,
	title: string,
	dayDate: string,
): string {
	const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@epicdev.ai`
	const dtstamp = formatDateForCalendarURL(new Date().toISOString())
	const dtstart = formatDateForCalendarURL(event.isoStartDate)
	const dtend = formatDateForCalendarURL(event.isoEndDate)

	const summary = `${title} - Office Hours (${event.startTime})`
	const description = `Join the office hours session for ${title} on ${dayDate}.\\n\\nLive Stream Link: ${event.liveLink}\\n\\nTime: ${event.startTime} - ${event.endTime}`

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
		`SUMMARY:${summary}`,
		`DESCRIPTION:${description}`,
		`LOCATION:${event.liveLink}`,
		'STATUS:CONFIRMED',
		'SEQUENCE:0',
		'BEGIN:VALARM',
		'TRIGGER:-PT15M',
		'ACTION:DISPLAY',
		'DESCRIPTION:Office hours starting in 15 minutes',
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR',
	].join('\r\n')

	// Create a data URI for the ICS file
	const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponentSafe(icsContent)}`

	return dataUri
}
