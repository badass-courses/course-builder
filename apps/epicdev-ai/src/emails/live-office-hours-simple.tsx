import * as React from 'react'
import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Section,
	Text,
} from '@react-email/components'

export type SimpleOfficeHoursProps = {
	eventTitle?: string
	eventDate?: string
	userFirstName?: string
}

export const SimpleOfficeHoursEmail = ({
	eventTitle = 'Master the Model Context Protocol (MCP)',
	eventDate = 'September 22nd, 2025',
	userFirstName = 'there',
}: SimpleOfficeHoursProps) => {
	// Keep preview text under 55 characters
	const previewText = 'Office Hours Invitation'

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={content}>
						<Text style={heading}>{eventTitle}</Text>
						<Text style={paragraph}>Hey {userFirstName}!</Text>
						<Text style={paragraph}>
							We're excited to kick off our {eventTitle} cohort on {eventDate}!
						</Text>
						<Text style={paragraph}>
							Office hours will be held twice weekly on Mondays and Fridays.
						</Text>
						<Text style={paragraph}>
							These are interactive sessions where we'll review what you've
							learned, answer questions, and connect with other learners.
						</Text>
						<Text style={paragraph}>Looking forward to seeing you there!</Text>
						<Text style={paragraph}>
							Best,
							<br />
							Epic AI Pro
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

export default SimpleOfficeHoursEmail

const main = {
	backgroundColor: '#f6f9fc',
	fontFamily: 'Arial, sans-serif',
}

const container = {
	backgroundColor: '#ffffff',
	margin: '0 auto',
	padding: '20px',
	borderRadius: '5px',
}

const content = {
	padding: '20px',
}

const heading = {
	fontSize: '24px',
	fontWeight: 'bold',
	marginBottom: '20px',
}

const paragraph = {
	fontSize: '16px',
	lineHeight: '24px',
	marginBottom: '16px',
}
