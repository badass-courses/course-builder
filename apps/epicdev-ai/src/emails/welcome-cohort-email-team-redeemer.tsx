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
import { format, isAfter, parse } from 'date-fns'

import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

export interface WelcomeCohortEmailTeamRedeemerProps {
	cohortTitle: string
	url: string
	dayOneUnlockDate: string
	userFirstName?: string
	supportEmail?: string
}

export default function WelcomeCohortEmailForTeamRedeemer({
	cohortTitle,
	url,
	dayOneUnlockDate,
	userFirstName,
	supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL,
}: WelcomeCohortEmailTeamRedeemerProps) {
	if (process.env.LOG_LEVEL === 'debug') {
		// eslint-disable-next-line no-console
		console.debug('Rendering WelcomeCohortEmailForTeamRedeemer', {
			cohortTitle,
		})
	}

	const everyTimeZoneLink = buildEtzLink(dayOneUnlockDate, '9:00 AM')
	const greeting = userFirstName ? `Hey ${userFirstName},` : 'Hi there,'
	const dayOneIsInFuture = isAfter(
		parse(dayOneUnlockDate, 'MMMM do, yyyy', new Date()),
		new Date(),
	)

	return (
		<Html>
			<Head />
			<Preview>You've claimed your seat for {cohortTitle}!</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={heading}>Welcome to {cohortTitle}! 🎉</Heading>

						<Section style={contentSection}>
							<Text style={text}>{greeting}</Text>
							<Text style={text}>
								You've successfully claimed your seat via your team's purchase.
							</Text>
						</Section>

						{dayOneIsInFuture ? (
							<Section style={contentSection}>
								<Text style={text}>
									You now have access to <strong>Day 1</strong>.
								</Text>
								<Section style={{ textAlign: 'center', marginTop: '20px' }}>
									<Link href={url} style={buttonStyle}>
										Get Started
										{/* with {cohortTitle} */}
									</Link>
								</Section>
							</Section>
						) : (
							<Section style={contentSection}>
								<Text style={text}>
									<strong>Heads up:</strong> <strong>Day&nbsp;1</strong> unlocks
									on {dayOneUnlockDate}.{' '}
								</Text>
								<Text style={text}>
									You'll receive another email when Day 1 unlocks.
								</Text>
							</Section>
						)}

						<Section style={contentSection}>
							<Text style={textSmall}>
								Questions? Contact{' '}
								<Link href={`mailto:${supportEmail}`} style={link}>
									{supportEmail}
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>See you inside,</Text>
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
