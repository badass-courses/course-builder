import * as React from 'react'
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

export interface TeamSubscriptionInviteEmailProps {
	url: string
	host: string
	email: string
	siteName: string
	productTitle: string
	inviterName?: string
	previewText?: string
}

/**
 * Email template for team subscription invitations.
 * Sent when a team owner invites a member to join their subscription.
 * Includes a magic login link for immediate access.
 */
export default function TeamSubscriptionInviteEmail({
	url,
	host,
	email,
	siteName,
	productTitle,
	inviterName,
	previewText = 'You have been invited to join a team subscription',
}: TeamSubscriptionInviteEmailProps) {
	const inviterDisplay = inviterName || 'A team administrator'
	const supportEmail =
		process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${host}`

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={heading}>
							You've Been Invited to {productTitle}! 🎉
						</Heading>

						<Section style={contentSection}>
							<Text style={text}>Hi there,</Text>
							<Text style={text}>
								<strong>{inviterDisplay}</strong> has invited you to join their
								team subscription for <strong>{productTitle}</strong>.
							</Text>

							<Text style={text}>
								Your access is ready! Click the button below to log in and start
								learning:
							</Text>

							<Section style={{ textAlign: 'center', marginTop: '24px' }}>
								<Link href={url} style={buttonStyle}>
									Log In & Get Started
								</Link>
							</Section>
						</Section>

						<Section style={contentSection}>
							<Text style={textSmall}>
								If you don't have an account yet, one has been created for you.
								You can log in using this email address ({email}).
							</Text>
						</Section>

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
							<Text style={text}>Welcome aboard!</Text>
							<Text style={text}>The {siteName} Team</Text>
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
	padding: '14px 24px',
	textDecoration: 'none',
	borderRadius: '5px',
	display: 'inline-block',
	fontWeight: 'bold' as const,
	fontSize: '16px',
}
