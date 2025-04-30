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

interface WelcomeEmailProps {
	productName?: string
	startDate?: string
	startTime?: string
	endTime?: string
}

export default function WelcomeEmail({
	productName,
	startDate = 'May 8th, 2025',
	startTime = '8:30 AM',
	endTime = '2:30 PM',
}: WelcomeEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Thank you for your purchase!</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={section}>
						<Section style={contentSection}>
							<Text style={text}>Hi there,</Text>
						</Section>
						<Section style={contentSection}>
							<Text style={text}>Thank you for purchasing {productName}!</Text>
						</Section>
						<Section style={contentSection}>
							<Text style={text}>
								The event will occur on {startDate} at {startTime} - {endTime}{' '}
								(Pacific time).{' '}
								<Link href={`https://everytimezone.com/s/005d0749`}>
									Click here for timezones
								</Link>
								.
							</Text>
						</Section>
						<Section style={contentSection}>
							<Text style={text}>
								Event details, including the Zoom link, Google Calendar invite,
								and other relevant information, will be emailed to you a few
								days before the workshop.
							</Text>
						</Section>
						<Section style={contentSection}>
							<Text style={text}>Please note:</Text>
							<Text style={bulletPoint}>
								• No recording of this live event will be provided, but you will
								get access to the self-paced version of the workshop.
							</Text>
							<Text style={bulletPoint}>
								• Tickets are non-refundable but transferable.
							</Text>
						</Section>
						<Section style={contentSection}>
							<Text style={text}>Important Information: </Text>
							<Text style={bulletPoint}>
								• Access your Invoice: Once you're logged in, you can view and
								fully customize your invoice{' '}
								<Link href="https://www.craftofui.dev/invoices">here</Link>. You
								can add any required information to the "Prepared for" section
								of the invoice and download a PDF that can be shared or
								forwarded.
							</Text>
						</Section>
						<Section style={contentSection}>
							<Text style={text}>See you in the workshop! </Text>
						</Section>
					</Section>
				</Container>
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

const section = {
	padding: '32px',
	borderRadius: '12px',
}

const contentSection = {
	marginTop: '24px',
}

const text = {
	color: '#000000',
	fontSize: '16px',
	lineHeight: '24px',
	margin: '0',
}

const bulletPoint = {
	color: '#000000',
	fontSize: '16px',
	lineHeight: '24px',
	margin: '8px 0 0 0',
	paddingLeft: '8px',
}
