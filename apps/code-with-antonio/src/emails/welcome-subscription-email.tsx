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

export interface WelcomeSubscriptionEmailProps {
	productName: string
	userFirstName?: string
	supportEmail?: string
	dashboardUrl?: string
}

/**
 * Welcome email sent to users after they purchase a subscription.
 * Confirms their subscription and provides links to start exploring content.
 */
export default function WelcomeSubscriptionEmail({
	productName,
	userFirstName,
	supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL,
	dashboardUrl = `${env.COURSEBUILDER_URL}/browse`,
}: WelcomeSubscriptionEmailProps) {
	const greeting = userFirstName ? `Hey ${userFirstName},` : 'Hi there,'

	return (
		<Html>
			<Head />
			<Preview>Welcome to {productName}! Your subscription is active.</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={heading}>Welcome to {productName}! 🎉</Heading>

						<Section style={contentSection}>
							<Text style={text}>{greeting}</Text>
							<Text style={text}>
								Your subscription to <strong>{productName}</strong> is now
								active. You have full access to all included content.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>What's Included:</strong>
							</Text>
							<Text style={bulletPoint}>
								✓ Access to all workshops and courses in your subscription
							</Text>
							<Text style={bulletPoint}>✓ New content as it's released</Text>
							<Text style={bulletPoint}>✓ Discord community access</Text>
						</Section>

						<Section style={{ textAlign: 'center', marginTop: '30px' }}>
							<Link href={dashboardUrl} style={buttonStyle}>
								Start Learning
							</Link>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>Managing Your Subscription:</strong>
							</Text>
							<Text style={textSmall}>
								You can manage your subscription, update payment methods, or
								view invoices from your{' '}
								<Link href={`${env.COURSEBUILDER_URL}/profile`} style={link}>
									profile page
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={textSmall}>
								Questions? Reply to this email or reach out to{' '}
								<Link href={`mailto:${supportEmail}`} style={link}>
									{supportEmail}
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>Happy learning,</Text>
							<Text style={text}>The {env.NEXT_PUBLIC_SITE_TITLE} Team</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

export interface WelcomeSubscriptionTeamEmailProps {
	productName: string
	userFirstName?: string
	supportEmail?: string
	quantity: number
}

/**
 * Returns properly pluralized seat label: "1 seat" or "{n} seats"
 */
function formatSeats(quantity: number): string {
	return quantity === 1 ? '1 seat' : `${quantity} seats`
}

/**
 * Welcome email sent to team purchasers after buying a team subscription.
 * Explains seat management and how to invite team members.
 */
export function WelcomeSubscriptionTeamEmail({
	productName,
	userFirstName,
	supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL,
	quantity,
}: WelcomeSubscriptionTeamEmailProps) {
	const greeting = userFirstName ? `Hey ${userFirstName},` : 'Hi there,'
	const teamManagementUrl = `${env.COURSEBUILDER_URL}/team`

	return (
		<Html>
			<Head />
			<Preview>
				{`Your team subscription to ${productName} is active! Manage your ${formatSeats(quantity)}.`}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={heading}>
							Your Team Subscription is Active! 🚀
						</Heading>

						<Section style={contentSection}>
							<Text style={text}>{greeting}</Text>
							<Text style={text}>
								You've successfully purchased a team subscription to{' '}
								<strong>{productName}</strong> with{' '}
								<strong>{formatSeats(quantity)}</strong>.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>Managing Your Team:</strong>
							</Text>
							<Text style={bulletPoint}>
								<strong>1. Claim Your Seat:</strong> As the purchaser, you can
								claim one of the seats for yourself.
							</Text>
							<Text style={bulletPoint}>
								<strong>2. Invite Team Members:</strong> Send invitations to
								your colleagues so they can access the content.
							</Text>
						</Section>

						<Section style={{ textAlign: 'center', marginTop: '30px' }}>
							<Link href={teamManagementUrl} style={buttonStyle}>
								Manage Your Team
							</Link>
						</Section>

						<Section style={contentSection}>
							<Text style={textSmall}>
								Team members will receive their own welcome email once they
								accept their invitation.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>Subscription Management:</strong>
							</Text>
							<Text style={textSmall}>
								Manage billing, add seats, or view invoices from your{' '}
								<Link href={`${env.COURSEBUILDER_URL}/profile`} style={link}>
									profile page
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={textSmall}>
								Questions? Reply to this email or reach out to{' '}
								<Link href={`mailto:${supportEmail}`} style={link}>
									{supportEmail}
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>Happy learning,</Text>
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

const bulletPoint = {
	...text,
	paddingLeft: '15px',
	margin: '8px 0',
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
