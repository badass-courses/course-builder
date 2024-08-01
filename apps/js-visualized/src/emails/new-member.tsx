import * as React from 'react'
import { env } from '@/env.mjs'
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
	userId: string
	body?: string
	preview?: string
	messageType?: 'transactional' | 'broadcast'
	unsubscribeLinkUrl?: string
	supportPhysicalAddress?: string
	courseBuilderUrl?: string
}

export const NewMemberEmail = ({
	userId = '12345',
	body = `Thanks so much,
JS Visualized`,
	preview = `Please confirm your email address by clicking the button below.`,
	messageType = 'broadcast',
	unsubscribeLinkUrl = '{{{ pm:unsubscribe }}}',
	courseBuilderUrl = `https://www.jsvisualized.com`,
	supportPhysicalAddress = `12333 Sowden Rd, Ste. B, PMB #97429 Houston, TX 77080-2059`,
}: NewMemberEmailProps) => {
	return (
		<Tailwind>
			<Html>
				<Head />
				<Preview>{preview}</Preview>
				<Body style={main}>
					<Section style={content} className="pb-8">
						Welcome to JS Visualized! We are excited to have you join our
						community. Please confirm your email address by clicking the button
						below.
					</Section>
					<Section style={content} className="pb-8">
						<Button
							href={`${courseBuilderUrl}/confirmed?cb=${userId}`}
							className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Confirm Your Email Address
						</Button>
					</Section>
					<Section style={content}>
						<Markdown>{body}</Markdown>
					</Section>
					<Section style={footer}>
						{messageType === 'broadcast' ? (
							<>
								<Row>
									<Link href={unsubscribeLinkUrl}>unsubscribe</Link>
								</Row>
								<Row>{supportPhysicalAddress}</Row>
							</>
						) : null}
					</Section>
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
