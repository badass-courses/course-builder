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

export interface WelcomeWorkshopEmailTeamProps {
	workshopTitle: string
	url: string
	quantity: number
	userFirstName?: string
	supportEmail?: string
	invoiceUrl?: string
}

export default function WelcomeWorkshopEmailForTeam({
	workshopTitle,
	url,
	quantity,
	userFirstName,
	supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL,
	invoiceUrl,
}: WelcomeWorkshopEmailTeamProps) {
	if (process.env.LOG_LEVEL === 'debug') {
		console.debug('Rendering WelcomeWorkshopEmailForTeam', {
			workshopTitle,
			quantity,
		})
	}

	const greeting = userFirstName ? `Hey ${userFirstName},` : 'Hi there,'
	const teamDashboardUrl = `${env.COURSEBUILDER_URL}/team`

	return (
		<Html>
			<Head />
			<Preview>Welcome! Manage your {String(quantity)} cohort seats</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={heading}>
							Your Team is Registered for {workshopTitle}! 🎉
						</Heading>

						<Section style={contentSection}>
							<Text style={text}>{greeting}</Text>
							<Text style={text}>
								You've purchased <strong>{quantity}</strong>{' '}
								{quantity === 1 ? 'seat' : 'seats'} to{' '}
								<strong>{workshopTitle}</strong>.
							</Text>

							<Text style={text}>
								(You will need to redeem a seat on your team.)
							</Text>
							<Section style={{ textAlign: 'center', marginTop: '20px' }}>
								<Link href={url} style={buttonStyle}>
									Get Started with {workshopTitle}
								</Link>
							</Section>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								Manage your team seats anytime from your dashboard:
							</Text>
							<Section style={{ textAlign: 'center', marginTop: '20px' }}>
								<Link href={teamDashboardUrl} style={buttonStyle}>
									Manage Seats
								</Link>
							</Section>
						</Section>

						<Section style={contentSection}>
							<Text style={textSmall}>
								Need an invoice?{' '}
								<Link
									href={invoiceUrl || `${env.COURSEBUILDER_URL}/invoices`}
									style={link}
								>
									View it here
								</Link>
								. Questions? Contact{' '}
								<Link href={`mailto:${supportEmail}`} style={link}>
									{supportEmail}
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>Thank you!</Text>
							<Text style={text}>The {env.NEXT_PUBLIC_SITE_TITLE} Team</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

const main = {
	backgroundColor: '#f6f9fc',
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	padding: '20px 0',
}

const container = {
	backgroundColor: '#ffffff',
	border: '1px solid #dfe3e8',
	borderRadius: '12px',
	margin: '0 auto',
	padding: '0',
	maxWidth: '580px',
}

const section = {
	padding: '32px',
}

const heading = {
	color: '#1a202c',
	fontSize: '28px',
	fontWeight: 'bold' as const,
	lineHeight: '36px',
	textAlign: 'center' as const,
	margin: '0 0 30px',
}

const contentSection = {
	marginTop: '24px',
}

const text = {
	color: '#333333',
	fontSize: '16px',
	lineHeight: '26px',
	margin: '0 0 16px',
}

const textSmall = {
	...text,
	fontSize: '14px',
	lineHeight: '22px',
	color: '#555555',
}

const link = {
	color: '#007bff',
	textDecoration: 'underline',
}

const buttonStyle = {
	backgroundColor: '#007bff',
	color: '#ffffff',
	padding: '12px 20px',
	textDecoration: 'none',
	borderRadius: '5px',
	display: 'inline-block',
	fontWeight: 'bold' as const,
}
