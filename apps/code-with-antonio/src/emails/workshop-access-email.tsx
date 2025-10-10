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
import { Markdown } from '@react-email/markdown'

interface WorkshopAccessEmailProps {
	user: {
		name?: string
		email: string
	}
	workshop: {
		fields: {
			title: string
			description?: string
			startsAt?: string
			slug?: string
		}
	}
	emailContent: {
		fields: {
			title: string
			body?: string
		}
	}
}

export const WorkshopAccessEmail = ({
	user,
	workshop,
	emailContent,
}: WorkshopAccessEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>{emailContent.fields.title}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={h1}>{emailContent.fields.title}</Heading>
						<Text style={text}>Hi {user.name || 'there'},</Text>
						<Text style={text}>
							Great news! Your access to{' '}
							<Link
								href={`${process.env.NEXT_PUBLIC_URL}/workshops/${workshop.fields.slug}`}
							>
								{workshop.fields.title}
							</Link>{' '}
							workshop is starting today.
						</Text>
						<Text style={text}>
							<Button
								href={`${process.env.NEXT_PUBLIC_URL}/workshops/${workshop.fields.slug}`}
							>
								Start Learning
							</Button>
						</Text>
						{emailContent.fields.body && (
							<div style={markdownContent}>
								<Markdown>{emailContent.fields.body}</Markdown>
							</div>
						)}
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

// Email styles
const main = {
	backgroundColor: '#ffffff',
	fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
}

const container = {
	backgroundColor: '#ffffff',
	border: '1px solid #eee',
	borderRadius: '5px',
	boxShadow: '0 5px 10px rgba(20,50,70,.2)',
	marginTop: '20px',
	maxWidth: '600px',
	padding: '68px 0 130px',
}

const h1 = {
	color: '#1d1c1d',
	fontSize: '24px',
	fontWeight: '700',
	margin: '30px 0',
	padding: '0',
	lineHeight: '42px',
}

const section = {
	padding: '0 48px',
}

const text = {
	color: '#525252',
	fontSize: '16px',
	lineHeight: '24px',
	textAlign: 'left' as const,
}

const markdownContent = {
	color: '#525252',
	fontSize: '16px',
	lineHeight: '24px',
	margin: '24px 0',
}

export default WorkshopAccessEmail
