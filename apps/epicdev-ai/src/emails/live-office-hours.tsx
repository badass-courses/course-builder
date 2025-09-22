import * as React from 'react'
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from '@react-email/components'
import { Markdown } from '@react-email/markdown'

import {
	generateGoogleCalendarLink,
	generateICalendarLink,
	generateOutlookCalendarLink,
	generateYahooCalendarLink,
} from './utils/calendar-links'
import type {
	OfficeHoursDay,
	OfficeHoursEvent,
} from './utils/generate-ics-attachments'

export type LiveOfficeHoursInvitationProps = {
	eventTitle: string
	eventDate: string
	days: OfficeHoursDay[]
	userFirstName?: string
	messageType?: 'transactional' | 'broadcast'
	unsubscribeLinkUrl?: string
}

const OfficeHoursEntry = ({
	event,
	eventTitle,
	dayDate,
}: {
	event: OfficeHoursEvent
	eventTitle: string
	dayDate: string
}) => {
	const googleLink = generateGoogleCalendarLink(event, eventTitle, dayDate)
	const yahooLink = generateYahooCalendarLink(event, eventTitle, dayDate)
	const outlookLink = generateOutlookCalendarLink(event, eventTitle, dayDate)
	const icalLink = generateICalendarLink(event, eventTitle, dayDate)

	return (
		<Section style={entryStyle}>
			<Text style={entryTimeStyle}>
				<strong>
					{event.startTime} - {event.endTime}
				</strong>
			</Text>
			<Text style={entryDetailsStyle}>
				YouTube:{' '}
				<Link href={event.liveLink} style={linkStyle}>
					{event.liveLink}
				</Link>
			</Text>
			<Text style={calendarLinksStyle}>
				Add to calendar:{' '}
				<Link href={googleLink} style={linkStyle}>
					Google
				</Link>
				{' • '}
				<Link href={yahooLink} style={linkStyle}>
					Yahoo
				</Link>
				{' • '}
				<Link href={outlookLink} style={linkStyle}>
					Outlook
				</Link>
				{' • '}
				<Link href={icalLink} style={linkStyle}>
					iCal
				</Link>
			</Text>
		</Section>
	)
}

export const LiveOfficeHoursInvitation = ({
	eventTitle = 'Master the Model Context Protocol (MCP)',
	eventDate = 'September 22nd, 2025',
	days = [],
	userFirstName,
	messageType = 'broadcast',
	unsubscribeLinkUrl = '{{{ pm:unsubscribe }}}',
}: LiveOfficeHoursInvitationProps) => {
	const greeting = userFirstName ? `Hey ${userFirstName}!` : 'Hi there!'
	// Simple preview text that works across email clients
	const previewText = `You're invited to ${eventTitle}!`

	// Removed unused variable since we're using individual Text components

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={content}>
						<Heading as="h1" style={h1}>
							{eventTitle}
						</Heading>
						<Text style={subtitle}>Office Hours Starting {eventDate}</Text>

						<Hr style={divider} />

						<Text style={text}>{greeting}</Text>

						<Text style={text}>
							We're pumped to kick off our {eventTitle} cohort on {eventDate}!
						</Text>

						<Text style={text}>
							To accommodate everyone's schedules and time zones, we are hosting{' '}
							<strong>two office hour sessions</strong> on Mondays and Fridays
							for the next two weeks. Each session covers the same content, so
							pick whichever time works best for you (or join both if you're
							really into it!).
						</Text>

						<Text style={text}>
							These are interactive sessions where we'll:
						</Text>

						<Text style={bulletText}>• Review what you've learned so far</Text>
						<Text style={bulletText}>• Answer your questions live</Text>
						<Text style={bulletText}>• Share tips and best practices</Text>
						<Text style={{ ...bulletText, marginBottom: '24px' }}>
							• Connect with other learners in the cohort
						</Text>

						<Text style={text}>
							Below are all the scheduled office hours. Add these to your
							calendar now so you don't forget! The .ics files attached to this
							email should work with most calendar apps if the buttons below
							don't work for you.
						</Text>

						{days && days.length > 0 ? (
							days.map((day) => (
								<Section
									key={day.date}
									style={{ marginTop: '24px', marginBottom: '24px' }}
								>
									<Heading as="h2" style={dayHeading}>
										{day.date}
									</Heading>
									{day.events.map((event, index) => (
										<OfficeHoursEntry
											key={`${day.date}-${index}`}
											event={event}
											eventTitle={eventTitle}
											dayDate={day.date}
										/>
									))}
								</Section>
							))
						) : (
							<Text
								style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}
							>
								Office hours schedule will be added soon.
							</Text>
						)}

						<Section style={{ marginTop: '32px' }}>
							<Text style={closingText}>
								We're looking forward to seeing you there and helping you master
								the Model Context Protocol. This is going to be epic!
							</Text>

							<Text style={signatureText}>
								Keep coding,
								<br />
								Epic AI Pro
							</Text>
						</Section>
					</Section>

					<Section style={footer}>
						{messageType === 'broadcast' ? (
							<>
								<Row>
									<Link href={unsubscribeLinkUrl} style={footerLink}>
										unsubscribe
									</Link>
								</Row>
								<Row>
									<Text style={footerText}>
										12333 Sowden Rd, Ste. B, PMB #97429 Houston, TX 77080-2059
									</Text>
								</Row>
							</>
						) : null}
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

export default LiveOfficeHoursInvitation

const fontFamily = 'Helvetica, Arial, sans-serif'

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

const content = {
	padding: '40px',
}

const h1 = {
	color: '#1a1a1a',
	fontFamily,
	fontSize: '32px',
	fontWeight: 'bold',
	margin: '0',
	marginBottom: '8px',
	padding: '0',
}

const subtitle = {
	color: '#666',
	fontSize: '18px',
	fontWeight: 'normal',
	margin: '0',
	marginBottom: '24px',
	padding: '0',
}

const dayHeading = {
	color: '#1a1a1a',
	fontFamily,
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0',
	marginBottom: '12px',
	padding: '0',
}

const entryStyle = {
	marginBottom: '4px',
	paddingBottom: '4px',
	marginLeft: '8px',
}

const entryTimeStyle = {
	fontSize: '14px',
	color: '#1a1a1a',
	marginBottom: '0px',
}

const entryDetailsStyle = {
	fontSize: '13px',
	color: '#666',
	marginBottom: '4px',
}

const calendarLinksStyle = {
	fontSize: '13px',
	color: '#666',
	marginBottom: '0px',
}

const linkStyle = {
	color: '#0066cc',
	textDecoration: 'underline',
}

const divider = {
	borderColor: '#e1e4e8',
	margin: '32px 0',
}

const text = {
	color: '#333333',
	fontSize: '16px',
	lineHeight: '26px',
	margin: '0 0 16px',
	whiteSpace: 'pre-wrap' as const,
	wordWrap: 'break-word' as const,
	overflowWrap: 'break-word' as const,
}

const bulletText = {
	...text,
	marginLeft: '20px',
	marginBottom: '8px',
}

const closingText = {
	...text,
	marginBottom: '16px',
}

const signatureText = {
	...text,
	marginTop: '24px',
}

const footer = {
	padding: '32px 40px',
}

const footerLink = {
	color: '#8898aa',
	fontSize: '12px',
	textDecoration: 'underline',
}

const footerText = {
	color: '#8898aa',
	fontSize: '12px',
	lineHeight: '16px',
	marginTop: '8px',
}
