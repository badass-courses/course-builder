'use client'

import * as React from 'react'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { useConvertkit } from '@/convertkit/use-convertkit'
import { Article } from '@/lib/articles'
import { track } from '@/utils/analytics'

export const ArticleCTA: React.FC<{ article: Article }> = ({ article }) => {
	const { canShowCta } = useConvertkit()
	const {
		fields: { slug },
	} = article

	return canShowCta ? (
		<section className="pt-16">
			<PrimaryNewsletterCta
				onSubmit={() => {
					track('subscribed from article', {
						article: slug,
					})
				}}
			/>
		</section>
	) : null
}
