import * as React from 'react'
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from '@react-email/components'

interface InstructorInviteEmailProps {
	inviteUrl: string
}

export default function InstructorInviteEmail({
	inviteUrl,
}: InstructorInviteEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>You have been invited to join egghead as an instructor</Preview>
			<Body style={main}>
				<Heading style={h1}>Welcome to egghead!</Heading>
				<Text style={text}>
					We're excited to invite you to join egghead as an instructor.
				</Text>
				<Section style={buttonContainer}>
					<a href={inviteUrl} rel="noopener noreferrer">
						click here to accept invite
					</a>
				</Section>
				<Text style={text}>
					If you have any questions, please don't hesitate to reach out to our
					team.
				</Text>
			</Body>
		</Html>
	)
}

const main = {
	backgroundColor: '#ffffff',
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
	margin: '0 auto',
	padding: '20px 0 48px',
	maxWidth: '580px',
}

const h1 = {
	color: '#1a1a1a',
	fontSize: '24px',
	fontWeight: '600',
	lineHeight: '40px',
	margin: '0 0 20px',
}

const text = {
	color: '#1a1a1a',
	fontSize: '16px',
	lineHeight: '24px',
	margin: '0 0 20px',
}

const buttonContainer = {
	padding: '27px 0 27px',
}

const button = {
	backgroundColor: '#000000',
	borderRadius: '3px',
	color: '#fff',
	fontSize: '16px',
	fontWeight: '600',
	textDecoration: 'none',
	textAlign: 'center' as const,
	display: 'block',
	width: '100%',
}

const footer = {
	color: '#8898aa',
	fontSize: '12px',
	lineHeight: '16px',
	margin: '12px 0 0',
}
