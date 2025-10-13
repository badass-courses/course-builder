import * as React from 'react'
import { env } from '@/env.mjs'
import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'
import { format } from 'date-fns'

import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

export interface LiveOfficeHoursInvitationProps {
	/** The name of the Live Office Hours event */
	eventTitle: string
	/** The URL to access the event */
	intro: string
	/** First event details */
	firstEvent: {
		/** Date string in format 'MMMM do, yyyy' */
		date: string
		/** Start time in format 'h:mm a' */
		startTime: string
		/** End time in format 'h:mm a' */
		endTime: string
		/** ISO date string for calendar links */
		isoStartDate: string
		/** ISO date string for calendar links */
		isoEndDate: string
		/** YouTube Live link for the event */
		liveLink: string
	}
	/** Second event details */
	secondEvent: {
		/** Date string in format 'MMMM do, yyyy' */
		date: string
		/** Start time in format 'h:mm a' */
		startTime: string
		/** End time in format 'h:mm a' */
		endTime: string
		/** ISO date string for calendar links */
		isoStartDate: string
		/** ISO date string for calendar links */
		isoEndDate: string
		/** YouTube Live link for the event */
		liveLink: string
	}
	/** Available modules information */
	modules?: Array<{
		/** Title of the module */
		title: string
		/** URL to access the module */
		link: string
		/** When the module becomes available */
		availableAt: string
	}>
	/** User's first name for personalization */
	userFirstName?: string
	/** Support email address */
	supportEmail?: string
}

/**
 * Generates calendar links for different calendar providers
 * @param event - Event details including dates and times
 * @param eventTitle - Title of the event
 * @param liveLink - YouTube Live link for the event
 * @returns Object containing calendar links for different providers
 */
function generateCalendarLinks(
	event: LiveOfficeHoursInvitationProps['firstEvent'],
	eventTitle: string,
	liveLink: string,
) {
	const encodedTitle = encodeURIComponent(eventTitle)
	const encodedDescription = encodeURIComponent(
		`Join us for Live Office Hours - an interactive session where you can ask questions and get help with your projects.\n\nYouTube Live Link: ${liveLink}`,
	)
	const encodedLocation = encodeURIComponent('Online (YouTube Live)')

	// Format dates for different calendar providers
	const googleStartDate = event.isoStartDate
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')
	const googleEndDate = event.isoEndDate
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')
	const outlookStartDate = event.isoStartDate
	const outlookEndDate = event.isoEndDate

	return {
		google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDescription}&dates=${googleStartDate}/${googleEndDate}&location=${encodedLocation}`,
		outlook: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&startdt=${outlookStartDate}&enddt=${outlookEndDate}&subject=${encodedTitle}&body=${encodedDescription}&location=${encodedLocation}`,
		yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodedTitle}&st=${googleStartDate}&et=${googleEndDate}&desc=${encodedDescription}&in_loc=${encodedLocation}`,
	}
}

/**
 * Generates ICS file content for calendar applications
 * @param event - Event details including dates and times
 * @param eventTitle - Title of the event
 * @param liveLink - YouTube Live link for the event
 * @returns ICS file content as string
 */
export function generateICSContent(
	event: LiveOfficeHoursInvitationProps['firstEvent'],
	eventTitle: string,
	liveLink: string,
) {
	const uid = `live-office-hours-${Date.now()}@${env.NEXT_PUBLIC_SITE_TITLE?.toLowerCase().replace(/\s+/g, '-') || 'ai-hero'}.com`
	const dtstamp = new Date()
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')

	// Ensure we have proper UTC dates for ICS format
	const startDate = new Date(event.isoStartDate)
	const endDate = new Date(event.isoEndDate)

	// Format as UTC for ICS (YYYYMMDDTHHMMSSZ)
	const dtstart = startDate
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')
	const dtend = endDate
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '')

	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${env.NEXT_PUBLIC_SITE_TITLE || 'AI Hero'}//Live Office Hours//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${eventTitle}
DESCRIPTION:Join us for Live Office Hours - an interactive session where you can ask questions and get help with your projects.\\n\\nYouTube Live Link: ${liveLink}
LOCATION:Online (YouTube Live)
END:VEVENT
END:VCALENDAR`
}

/**
 * Generates ICS attachments for both events
 * @param eventTitle - The main event title
 * @param firstEvent - First event details
 * @param secondEvent - Second event details
 * @returns Array of attachments for email sending
 */
export function generateICSAttachments(
	eventTitle: string,
	firstEvent: LiveOfficeHoursInvitationProps['firstEvent'],
	secondEvent: LiveOfficeHoursInvitationProps['secondEvent'],
) {
	const firstEventICS = generateICSContent(
		firstEvent,
		`${eventTitle} - Session 1`,
		firstEvent.liveLink,
	)
	const secondEventICS = generateICSContent(
		secondEvent,
		`${eventTitle} - Session 2`,
		secondEvent.liveLink,
	)

	return [
		{
			Name: `session-1.ics`,
			Content: Buffer.from(firstEventICS).toString('base64'),
			ContentType: 'text/calendar',
		},
		{
			Name: `session-2.ics`,
			Content: Buffer.from(secondEventICS).toString('base64'),
			ContentType: 'text/calendar',
		},
	]
}

/**
 * Live Office Hours invitation email component
 *
 * This email template is used to invite purchasers to Live Office Hours events.
 * It includes calendar functionality with add-to-calendar links for Google, Yahoo,
 * and Outlook. ICS files are attached to the email for easy calendar import.
 */
export default function LiveOfficeHoursInvitation({
	eventTitle,
	intro,
	firstEvent,
	secondEvent,
	modules,
	userFirstName,
	supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL,
}: LiveOfficeHoursInvitationProps) {
	if (process.env.LOG_LEVEL === 'debug') {
		console.debug('Rendering LiveOfficeHoursInvitation', { eventTitle })
	}

	const greeting = userFirstName ? `Hey ${userFirstName},` : 'Hi there,'

	return (
		<Html>
			<Head />
			<Preview>You're invited to {eventTitle}!</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Section style={contentSection}>
							<Text style={text}>{greeting}</Text>
							<Text style={text}>{intro}</Text>
						</Section>

						<Section style={contentSection}>
							<EventSession
								event={firstEvent}
								sessionNumber={1}
								eventTitle={eventTitle}
							/>
						</Section>

						<Section style={contentSection}>
							<EventSession
								event={secondEvent}
								sessionNumber={2}
								eventTitle={eventTitle}
							/>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>📅 Calendar Files Attached</strong>
							</Text>
							<Text style={text}>
								We've attached calendar files (.ics) to this email for each
								session. You can download and import these files into your
								calendar application (Apple Calendar, Outlook, Thunderbird,
								etc.) or use the calendar links above.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>💬 Join Discord</strong>
							</Text>
							<Text style={text}>
								Join other learners in our Discord to share your progress, ask
								questions, and get help with your projects.{' '}
								<Link
									href="https://www.aihero.dev/discord"
									style={link}
									target="_blank"
								>
									https://www.aihero.dev/discord
								</Link>
							</Text>
						</Section>

						{modules && modules.length > 0 && (
							<Section style={contentSection}>
								<Text style={text}>
									<strong>🚀 Upcoming Module</strong>
								</Text>
								{modules.map((module, index) => (
									<Section key={index} style={contentSection}>
										<Text style={text}>
											<strong>{module.title}</strong>
										</Text>
										<Text style={eventDetails}>
											<strong>Link:</strong>{' '}
											<Link href={module.link} style={link} target="_blank">
												{module.link}
											</Link>
										</Text>
										<Text style={eventDetails}>
											<strong>Available:</strong> {module.availableAt}
										</Text>
									</Section>
								))}
							</Section>
						)}

						<Section style={contentSection}>
							<Text style={text}>
								If you have any questions or issues accessing the content,
								please reach out to{' '}
								<Link href={`mailto:${supportEmail}`} style={link}>
									{supportEmail}
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>Looking forward to seeing you there!</Text>
							<Text style={text}>The {env.NEXT_PUBLIC_SITE_TITLE} Team</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

interface EventSessionProps {
	event: LiveOfficeHoursInvitationProps['firstEvent']
	sessionNumber: number
	eventTitle: string // Pass the overall eventTitle for ICS download filename
}

const EventSession = ({
	event,
	sessionNumber,
	eventTitle,
}: EventSessionProps) => {
	const sessionEventTitle = `${eventTitle} - Session ${sessionNumber}`
	const calendarLinks = generateCalendarLinks(
		event,
		sessionEventTitle,
		event.liveLink,
	)
	const timezoneLink = buildEtzLink(event.date, event.startTime)

	return (
		<div style={eventSessionContainer}>
			<Text style={eventSessionTitle}>📅 Session {sessionNumber}</Text>
			<Text style={eventSessionText}>
				<strong style={eventSessionStrong}>Date:</strong> {event.date}
			</Text>
			<Text style={eventSessionText}>
				<strong style={eventSessionStrong}>Time:</strong> {event.startTime} -{' '}
				{event.endTime} (PDT){' '}
				<Link href={timezoneLink} target="_blank" style={timezoneLinkStyle}>
					(View in your timezone)
				</Link>
			</Text>
			<Text style={eventSessionTextWithMargin}>
				<strong style={eventSessionStrong}>YouTube Live:</strong>{' '}
				<Link href={event.liveLink} target="_blank" style={link}>
					{event.liveLink}
				</Link>
			</Text>

			<div style={calendarButtonsContainer}>
				<Text style={calendarButtonsTitle}>
					<strong style={eventSessionStrong}>Add to Calendar:</strong>
				</Text>
				<div style={calendarButtonsWrapper}>
					<Link
						href={calendarLinks.google}
						style={calendarButton}
						target="_blank"
					>
						Google
					</Link>
					<Link
						href={calendarLinks.outlook}
						style={calendarButton}
						target="_blank"
					>
						Outlook
					</Link>
					<Link
						href={calendarLinks.yahoo}
						style={calendarButton}
						target="_blank"
					>
						Yahoo
					</Link>
				</div>
			</div>
		</div>
	)
}

const main = {
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	padding: '20px 0',
}

const container = {
	backgroundColor: '#ffffff',
	margin: '0 auto',
	padding: '0',
	maxWidth: '580px',
	width: '100%',
}

const section = {
	padding: '32px',
}

const contentSection = {
	marginTop: '24px',
}

const text = {
	color: '#333333',
	fontSize: '16px',
	lineHeight: '26px',
	margin: '0 0 16px',
	whiteSpace: 'pre-wrap',
	wordWrap: 'break-word' as const,
	overflowWrap: 'break-word' as const,
}

const eventDetails = {
	...text,
	margin: '0 0 8px',
}

const link = {
	color: '#007bff',
	textDecoration: 'underline',
	wordWrap: 'break-word' as const,
	overflowWrap: 'break-word' as const,
}

const eventSessionContainer = {
	marginBottom: '32px',
	borderRadius: '8px',
	border: '1px solid #e5e7eb',
	backgroundColor: '#f9fafb',
	padding: '24px',
	width: '100%',
	maxWidth: '100%',
	boxSizing: 'border-box' as const,
}

const eventSessionTitle = {
	...text,
	marginBottom: '12px',
	fontSize: '16px',
	fontWeight: 'bold' as const,
	color: '#1f2937',
	wordWrap: 'break-word' as const,
}

const eventSessionText = {
	...text,
	marginBottom: '8px',
	color: '#374151',
	wordWrap: 'break-word' as const,
	overflowWrap: 'break-word' as const,
}

const eventSessionTextWithMargin = {
	...eventSessionText,
	marginBottom: '16px',
}

const eventSessionStrong = {
	color: '#1f2937',
	fontWeight: 'bold' as const,
}

const timezoneLinkStyle = {
	marginLeft: '8px',
	fontSize: '16px',
	color: '#3b82f6',
	textDecoration: 'underline',
	wordWrap: 'break-word' as const,
}

const calendarButtonsContainer = {
	marginTop: '16px',
	width: '100%',
}

const calendarButtonsTitle = {
	color: '#1f2937',
	fontSize: '16px',
	fontWeight: 'bold' as const,
	marginBottom: '8px',
}

const calendarButtonsWrapper = {
	display: 'flex',
	flexWrap: 'wrap' as const,
	gap: '12px',
	marginTop: '8px',
	width: '100%',
}

const calendarButton = {
	display: 'inline-block',
	padding: '8px 16px',
	borderRadius: '6px',
	fontSize: '14px',
	fontWeight: 'bold' as const,
	color: '#ffffff',
	backgroundColor: '#3b82f6',
	textDecoration: 'none',
	whiteSpace: 'nowrap' as const,
	marginRight: '8px',
	marginBottom: '4px',
}
