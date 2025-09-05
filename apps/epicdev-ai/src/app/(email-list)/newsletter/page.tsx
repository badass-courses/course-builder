import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter, db } from '@/db'
import { products } from '@/db/schema'
import { commerceEnabled } from '@/flags'
import { getSaleBannerData } from '@/lib/sale-banner'
import { and, eq } from 'drizzle-orm'

export const metadata: Metadata = {
	title: 'Newsletter',
	description:
		'Subscribe to be the first to learn about AI Hero releases, updates, and special discounts for AI Engineers.',
}

export default async function NewsletterPage() {
	const isCommerceEnabled = await commerceEnabled()
	const allCohortProducts = await db.query.products.findMany({
		where: and(eq(products.status, 1), eq(products.type, 'cohort')),
	})
	const productIds = allCohortProducts.map((p) => p.id)

	let defaultCoupon = null
	if (productIds.length > 0) {
		const coupons = await courseBuilderAdapter.getDefaultCoupon(productIds)
		if (coupons?.defaultCoupon) {
			defaultCoupon = coupons.defaultCoupon
		}
	}

	const saleBannerData = await getSaleBannerData(defaultCoupon)

	return (
		<LayoutClient withContainer>
			{defaultCoupon && saleBannerData && isCommerceEnabled ? (
				<Link
					className="text-primary dark:border-foreground/5 mx-auto mb-2 flex max-w-full items-center justify-between gap-1 rounded-lg border border-violet-500/20 bg-violet-100 px-3 py-1 pr-2 text-xs font-medium shadow-md shadow-violet-600/10 sm:justify-center sm:pr-1 sm:text-sm dark:bg-violet-500/20 dark:shadow-none"
					href={saleBannerData.productPath}
					prefetch
				>
					<div className="flex flex-col sm:block">
						<span className="font-bold">Save {saleBannerData.percentOff}%</span>{' '}
						on {saleBannerData.productName}.{' '}
					</div>
					<div className="bg-linear-to-b font-heading from-primary ml-1 rounded-sm to-indigo-800 px-2 py-0.5 text-sm font-semibold text-white transition ease-out group-hover:underline">
						Get Your Ticket
					</div>
				</Link>
			) : null}
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
