import React from 'react'
import type { Metadata } from 'next'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'

const newsletterThumbnail =
	'https://res.cloudinary.com/total-typescript/image/upload/v1754898967/newsletter-thumbnail_2x.jpg'

const newsletterTitle = 'Code with Antonio Newsletter by Matt Pocock'
const newsletterDescription =
	'Subscribe to be the first to learn about Code with Antonio releases, updates, and special discounts for AI Engineers.'

export const metadata: Metadata = {
	title: newsletterTitle,
	description: newsletterDescription,
	openGraph: {
		title: newsletterTitle,
		description: newsletterDescription,
		images: [
			{
				url: newsletterThumbnail,
				width: 1200,
				height: 630,
			},
		],
	},
}

export default async function NewsletterPage() {
	return (
		<LayoutClient withContainer>
			<main className="pb-16 pt-3">
				<PrimaryNewsletterCta
					trackProps={{
						event: 'subscribed',
						params: {
							location: 'newsletter',
						},
					}}
				/>
			</main>
		</LayoutClient>
	)
}
