import React from 'react'
import type { Metadata } from 'next'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'

export const metadata: Metadata = {
	title: 'Newsletter',
	description:
		'Subscribe to be the first to learn about AI Hero releases, updates, and special discounts for AI Engineers.',
}

export default async function NewsletterPage() {
	return (
		<main>
			<PrimaryNewsletterCta className="min-h-screen pt-20">
				<div className="relative z-10 flex max-w-3xl flex-col items-center justify-center px-5 pb-10">
					<h1 className="font-heading fluid-2xl text-muted-foreground text-center font-extrabold">
						{`Subscribe to be the first to learn about AI Hero releases, updates, and special discounts for AI Engineers.`}
					</h1>
					<h2 className="fluid-base text-secondary pt-8 text-center font-sans font-normal">
						{`We're in this together!`}
					</h2>
				</div>
			</PrimaryNewsletterCta>
		</main>
	)
}
