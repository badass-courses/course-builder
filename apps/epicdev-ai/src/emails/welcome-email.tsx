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

import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

interface WelcomeEmailProps {
	productName?: string
	startDate?: string
	startTime?: string
	endTime?: string
	userFirstName?: string
	supportEmail?: string
}

/**
 * Welcome email component sent to users after they purchase a live event.
 * It confirms their spot, provides event details, and sets expectations for future communications.
 *
 * @param {string} [productName='Your Awesome Event'] - The name of the event/product.
 * @param {string} [startDate='May 8th, 2025'] - The start date of the event.
 * @param {string} [startTime='8:30 AM'] - The start time of the event.
 * @param {string} [endTime='2:30 PM'] - The end time of the event.
 * @param {string} [userFirstName] - The first name of the user for a personalized greeting.
 * @param {string} [supportEmail] - The support email address.
 */
export default function WelcomeEmail({
	productName = 'Your Awesome Event',
	startDate = 'May 8th, 2025',
	startTime = '8:30 AM',
	endTime = '2:30 PM',
	userFirstName,
	supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL,
}: WelcomeEmailProps) {
	const everyTimeZoneLink = buildEtzLink(startDate, startTime)
	const greeting = userFirstName ? `Hey ${userFirstName},` : 'Hi there,'

	return (
		<Html>
			<Head />
			<Preview>You're In! Get Ready for {productName}!</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Heading style={heading}>You're In! Get Ready! 🚀</Heading>

						<Section style={contentSection}>
							<Text style={text}>{greeting}</Text>
							<Text style={text}>
								You've successfully secured your spot for{' '}
								<strong>{productName}</strong> – we're excited to have you!
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								Here's a quick confirmation of the critical details:
							</Text>
							<Text style={bulletPoint}>
								<strong>Event:</strong> {productName}
							</Text>
							<Text style={bulletPoint}>
								<strong>Date:</strong> {startDate}
							</Text>
							<Text style={bulletPoint}>
								<strong>Time:</strong> {startTime} - {endTime} (Pacific Time).{' '}
								<Link href={everyTimeZoneLink} style={link}>
									View in your timezone
								</Link>
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>What Happens Next? Keep an Eye on Your Inbox!</strong>
							</Text>
							<Text style={text}>
								Shortly, you'll receive a separate email containing:
							</Text>
							<Text style={bulletPoint}>
								✓ The official Google Calendar invite (lock it in!)
							</Text>
							<Text style={bulletPoint}>
								✓ The Zoom link for the live event.
							</Text>
							<Text style={bulletPoint}>
								✓ Any pre-event materials or recommended prep work.
							</Text>
							<Text style={textSmall}>
								To ensure you don't miss these crucial updates, please add{' '}
								<strong style={highlight}>{supportEmail}</strong> to your
								trusted senders or whitelist.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								<strong>Important Policies & Info:</strong>
							</Text>
							<Text style={bulletPoint}>
								<strong>Live & Interactive:</strong> This is a live experience.
								To foster maximum engagement, no recording will be provided.
								However, you'll get access to the self-paced version of the
								workshop materials after the event. (Details on that will
								follow).
							</Text>
							<Text style={bulletPoint}>
								<strong>Tickets:</strong> Non-refundable, but totally
								transferable. If life happens, you can transfer your spot to a
								friend or colleague yourself via your{' '}
								<Link href={`${env.COURSEBUILDER_URL}/invoices`} style={link}>
									invoice page
								</Link>
								. No need to even tell us!
							</Text>
							<Text style={bulletPoint}>
								<strong>Invoice Access:</strong> Need to wrangle an invoice? Log
								in to your account to view, customize, and download it{' '}
								<Link href={`${env.COURSEBUILDER_URL}/invoices`} style={link}>
									right here
								</Link>
								.
							</Text>
						</Section>

						<Section style={contentSection}>
							<Text style={text}>
								We're stoked to have you and can't wait to dive into this with
								you!
							</Text>
							<Text style={text}>See you there,</Text>
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
	position: 'relative' as const,
}

const link = {
	color: '#007bff',
	textDecoration: 'underline',
}

const highlight = {
	fontWeight: 'bold' as const,
	color: '#e94e77',
}
