import React from 'react'
import type { Metadata } from 'next'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'

export const metadata: Metadata = {
	title: 'Newsletter',
	description:
		'Subscribe to be the first to learn about AI Hero releases, updates, and special discounts for AI Engineers.',
}

export default async function NewsletterPage() {
	return (
		<LayoutClient withContainer>
			<main className="flex h-full flex-grow flex-col items-center justify-center pb-16 pt-3">
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
