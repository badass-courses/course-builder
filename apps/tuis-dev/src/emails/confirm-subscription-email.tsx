import * as React from 'react'
import {
	Body,
	Button,
	Container,
	Font,
	Head,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from '@react-email/components'

export type ConfirmSubscriptionEmailProps = {
	url: string
	host: string
	email: string
	siteName: string
}

export const ConfirmSubscriptionEmail = ({
	url = 'https://tuis.dev',
	host = 'https://tuis.dev',
	email = 'you@example.com',
	siteName = 'tuis.dev',
}: ConfirmSubscriptionEmailProps) => {
	return (
		<Html>
			<Tailwind>
				<Head>
					<Font
						fontFamily="Inter"
						fallbackFontFamily="Helvetica"
						webFont={{
							url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2',
							format: 'woff2',
						}}
						fontStyle="normal"
					/>
					<meta name="color-scheme" content="light" />
					<meta name="supported-color-schemes" content="light" />
				</Head>
				<Preview>Confirm your subscription to {siteName}</Preview>

				<Body className="mx-auto my-auto bg-white font-sans">
					<Container className="mx-auto p-[20px] md:w-[465px]">
						<Text className="mx-0 my-[30px] p-0 text-center text-[24px] font-semibold leading-normal text-black">
							Confirm your subscription
						</Text>
						<Text className="text-center text-[14px] leading-[24px] text-[#3E3A38]">
							Thanks for subscribing to {siteName}. Click the button below to
							confirm your email address and start receiving updates.
						</Text>

						<Section className="mb-[32px] mt-[32px] text-center">
							<Button
								className="rounded bg-[#C0FFBD] px-5 py-3 text-center text-[16px] font-semibold text-black no-underline"
								href={url}
							>
								Confirm Subscription
							</Button>
						</Section>
						<Text className="text-[14px] leading-[24px] text-[#3E3A38]">
							or copy and paste this URL into your browser:{' '}
							<Link
								href={url}
								className="text-blue-600 no-underline"
								style={{ wordBreak: 'break-word' }}
							>
								{url}
							</Link>
						</Text>
						<Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
						<Text className="text-[12px] leading-[24px] text-[#666666]">
							This link is valid for 24 hours. If you didn&apos;t subscribe to{' '}
							{siteName}, you can safely ignore this email.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export default ConfirmSubscriptionEmail
