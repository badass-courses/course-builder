import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import ResourceTeaser from '@/components/content/resource-teaser'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getActiveCoupon, getSaleBannerData } from '@/lib/sale-banner'
import { compileMDX } from '@/utils/compile-mdx'
import { ChevronRight } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const searchParams = await props.searchParams
	const activeCoupon = await getActiveCoupon(searchParams)

	const ogImageUrl = activeCoupon
		? 'https://res.cloudinary.com/total-typescript/image/upload/v1730364326/aihero-golden-ticket_2x_qghsfq.png'
		: config.openGraph.images[0]!.url

	return {
		title: {
			template: '%s | Tech Build',
			default: `Build something great! - Tech Build`,
		},
		openGraph: {
			images: ogImageUrl ? [{ url: ogImageUrl }] : [],
		},
	}
}

type Props = {
	searchParams: Promise<{ [key: string]: string | undefined }>
}

const Home = async (props: Props) => {
	// const searchParams = await props.searchParams
	// const { allowPurchase, pricingDataLoader, product, commerceProps } =
	// 	await getPricingProps({ searchParams })
	const isCommerceEnabled = await commerceEnabled()
	// const page = await getPage('homepage-default')
	// const firstPageResource = page?.resources?.[0] && {
	// 	path: page.resources[0]?.resource?.fields?.slug,
	// 	title: page.resources[0]?.resource?.fields?.title,
	// }
	const searchParams = await props.searchParams
	const activeCoupon = await getActiveCoupon(searchParams)
	const saleBannerData = await getSaleBannerData(activeCoupon)
	// const { content: bodyContent } = await compileMDX(page?.fields?.body || '')

	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
		>
			<div>
				<section className="bg-primary dark:bg-primary-dark text-primary-foreground relative flex w-full flex-col items-center justify-center overflow-hidden py-10 lg:py-24">
					<div className="container relative z-10 flex w-full">
						<div className="flex flex-col items-center justify-center gap-4 text-center">
							<h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
								Get Really Good at AI-Powered Development
							</h1>
							<h2 className="mt-2 text-lg font-normal sm:text-xl lg:text-2xl">
								Bite-sized video tutorials, step‑by‑step exercises, and a
								community where we can keep refining techniques together.
							</h2>
							<Button asChild variant="secondary" size="lg" className="mt-4">
								<Link href="/browse">
									Browse courses <ChevronRight className="size-4" />
								</Link>
							</Button>
						</div>
					</div>
				</section>

				<section>
					<div className="container items-center justify-center pb-10 pt-16">
						<PrimaryNewsletterCta className="mx-auto max-w-3xl" />
					</div>
				</section>
			</div>
		</LayoutClient>
	)
}

export default Home
