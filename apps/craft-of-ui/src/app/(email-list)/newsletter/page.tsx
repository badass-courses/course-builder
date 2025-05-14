import React from 'react'
import type { Metadata } from 'next'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'

export const metadata: Metadata = {
	title: 'Newsletter',
	description:
		'Subscribe to be the first to learn about The Craft of UI releases, updates, and special discounts for UI Engineers.',
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
