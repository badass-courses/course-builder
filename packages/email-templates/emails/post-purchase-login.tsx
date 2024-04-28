import * as React from 'react'
import {
	Body,
	Button,
	Column,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from '@react-email/components'

interface PostPurchaseLoginEmailProps {
	url: string
	host: string
	email: string
	siteName: string
	invoiceUrl?: string
	previewText: string
}

interface Theme {
	colorScheme?: 'auto' | 'dark' | 'light'
	logo?: string
	brandColor?: string
}

export const PostPurchaseLoginEmail = (
	{
		url = 'https://coursebuilder.dev',
		host = 'https://coursebuilder.dev',
		email = 'joel@coursebuilder.dev',
		siteName = 'Course Builder',
		invoiceUrl,
		previewText = 'Welcome!',
	}: PostPurchaseLoginEmailProps,
	theme: Theme,
) => {
	const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`
	const escapedHost = `${host.replace(/\./g, '&#8203;.')}`

	// Some simple styling options
	const backgroundColor = '#F9FAFB'
	const textColor = '#3E3A38'
	const mainBackgroundColor = '#ffffff'
	const buttonBackgroundColor = theme ? theme.brandColor : '#F9FAFB'
	const buttonTextColor = '#ffffff'

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
				</Head>
				<Preview>{previewText}</Preview>

				<Body className="mx-auto my-auto bg-white font-sans">
					<Container className="mx-auto my-[40px] rounded border border-solid border-[#eaeaea] p-[20px] md:w-[465px]">
						{theme?.logo && (
							<Section className="mt-[32px]">
								<Img
									src={`${theme.logo}`}
									width="180"
									alt={siteName}
									className="mx-auto my-0"
								/>
							</Section>
						)}
						<Text className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
							Log in as{' '}
							<strong className={`text-[${textColor}]`}>{email}</strong> to{' '}
							{siteName}.
						</Text>

						<Section className="mb-[32px] mt-[32px] text-center">
							<Button
								className="rounded bg-[#000000] px-4 py-3 text-center text-[16px] font-semibold text-white no-underline"
								href={url}
							>
								Log In
							</Button>
						</Section>
						<Text className="text-[14px] leading-[24px] text-black">
							or copy and paste this URL into your browser:{' '}
							<Link href={url} className="text-blue-600 no-underline">
								{url}
							</Link>
						</Text>
						{invoiceUrl && (
							<Text className="text-[14px] leading-[24px] text-black">
								<Link href={invoiceUrl} className="text-blue-600 no-underline">
									Get your customizable invoice here.
								</Link>
							</Text>
						)}
						<Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
						<Text className="text-[12px] leading-[24px] text-[#666666]">
							The login link above is valid for 24 hours or until it is used
							once. You will stay logged in for 60 days.{' '}
							<Link
								href={host + '/login'}
								target="_blank"
								className="text-blue-600 no-underline"
							>
								Click here to request another link{' '}
							</Link>
							if the link above isn't working.
						</Text>
						<Text className="text-[12px] leading-[24px] text-[#666666]">
							Once you are logged in, you can{' '}
							<Link
								href={`${host}/invoices`}
								target="_blank"
								className="text-blue-600 no-underline"
							>
								access all of your invoices here
							</Link>
							.
						</Text>
						<Text className="text-[12px] leading-[24px] text-[#666666]">
							Need additional help? Reply!
						</Text>
						<Text className="text-[12px] leading-[24px] text-[#666666]">
							If you did not request this email you can safely ignore it.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export default PostPurchaseLoginEmail
