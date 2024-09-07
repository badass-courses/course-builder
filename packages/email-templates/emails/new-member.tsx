import * as React from 'react'
import {
	Body,
	Button,
	Head,
	Html,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
} from '@react-email/components'
import { Markdown } from '@react-email/markdown'

export type NewMemberEmailProps = {
	url: string
	host: string
	email: string
	preview?: string
	messageType?: 'transactional' | 'broadcast'
	siteName: string
}

export const NewMemberEmail = ({
	url = 'https://coursebuilder.dev',
	host = 'https://coursebuilder.dev',
	email = 'joel@coursebuilder.dev',
	siteName = 'coursebuilder',
	preview = `confirm your email address`,
}: NewMemberEmailProps) => {
	return (
		<Tailwind>
			<Html>
				<Head />
				<Preview>{preview}</Preview>
				<Body style={main}>
					<Section style={content} className="pb-8">
						Welcome to {siteName}! We are excited to have you join our
						community. Please confirm your email address by clicking the button
						below.
					</Section>
					<Section style={content} className="pb-8">
						<Button
							href={url}
							className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Confirm Your Email Address
						</Button>
					</Section>
					<Section style={content}>Thanks, {siteName}</Section>
				</Body>
			</Html>
		</Tailwind>
	)
}

export default NewMemberEmail

const fontFamily = 'HelveticaNeue,Helvetica,Arial,sans-serif'

const main = {
	fontFamily,
}

const footer = {
	padding: '70px 8px',
	lineHeight: 1.5,
	fontSize: 12,
}

const content = {
	padding: '0 8px',
}
