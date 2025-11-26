import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import ResourceTeaser from '@/components/content/resource-teaser'
import { LandingPage } from '@/components/landing-page'
import {
	FeatureCard,
	FeatureGrid,
	FeatureHeader,
	FeatureSection,
	SplitContent,
	SplitSection,
	SplitVisual,
} from '@/components/landing/feature-section'
import HomeFeed from '@/components/landing/home-feed'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { commerceEnabled } from '@/flags'
import { getFeed } from '@/lib/feed'
import { getPage } from '@/lib/pages-query'
import { getActiveCoupon, getSaleBannerData } from '@/lib/sale-banner'
import { compileMDX } from '@/utils/compile-mdx'
import { Brain, ChevronRight, Layers, Terminal } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import { Instructor } from './admin/pages/_components/page-builder-mdx-components'

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
	// const firstPageResource = page?.resources?.[0] && {
	// 	path: page.resources[0]?.resource?.fields?.slug,
	// 	title: page.resources[0]?.resource?.fields?.title,
	// }
	const searchParams = await props.searchParams
	const activeCoupon = await getActiveCoupon(searchParams)
	const saleBannerData = await getSaleBannerData(activeCoupon)
	const feedLoader = getFeed()
	const page = await getPage('root')

	const { content: bodyContent } = await compileMDX(page?.fields?.body || '', {
		Instructor: () => <Instructor />,
		PrimaryNewsletterCta: (props) => <PrimaryNewsletterCta {...props} />,
		FeatureSection: (props) => <FeatureSection {...props} />,
		FeatureHeader: (props) => <FeatureHeader {...props} />,
		FeatureGrid: (props) => <FeatureGrid {...props} />,
		FeatureCard: (props) => <FeatureCard {...props} />,
		SplitSection: (props) => <SplitSection {...props} />,
		SplitContent: (props) => <SplitContent {...props} />,
		SplitVisual: (props) => <SplitVisual {...props} />,
		Feed: (props) => <HomeFeed feedLoader={feedLoader} {...props} />,
		Brain: Brain,
		Terminal: Terminal,
		Layers: Layers,
	})

	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
		>
			<div>
				<section className="relative flex w-full flex-col items-center justify-center overflow-hidden py-20 sm:py-24 lg:py-32">
					{/* Dot grid background pattern inspired by motion.dev */}
					<div
						className="pointer-events-none absolute inset-0"
						aria-hidden="true"
						style={{
							backgroundImage: `
							radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.8983 0.1856 100.36 / 0.08) 0%, transparent 70%),
							radial-gradient(circle, var(--foreground) 1px, transparent 1px)
						`,
							backgroundSize: '100% 100%, 10px 10px',
							backgroundPosition: 'center center',
							maskImage:
								'radial-gradient(ellipse 100% 100% at 50% 45%, black 10%, transparent 55%)',
							WebkitMaskImage:
								'radial-gradient(ellipse 100% 100% at 50% 45%, black 10%, transparent 55%)',
							opacity: 0.15,
						}}
					/>
					<div className="relative z-10 flex w-full items-center justify-center">
						<div className="flex flex-col items-center justify-center gap-4 text-center">
							<h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
								Get Really Good
								<br /> at AI–Powered Development
							</h1>
							<h2 className="text-muted-foreground mt-2 max-w-2xl text-base font-normal sm:text-lg lg:text-xl">
								Bite-sized{' '}
								<span className="text-foreground font-medium">
									video tutorials
								</span>
								,{' '}
								<span className="text-foreground font-medium">
									step‑by‑step exercises
								</span>
								, and a{' '}
								<span className="text-foreground font-medium">community</span>{' '}
								where we can keep refining techniques together.
							</h2>
							{/* TODO: Re-enable when there's some content */}
							{/* <Button asChild variant="secondary" size="lg" className="mt-4">
							<Link href="/browse">
								Browse courses <ChevronRight className="size-4" />
							</Link>
						</Button> */}
						</div>
					</div>
				</section>
				<section className="relative z-10">
					<HomeFeed feedLoader={feedLoader} />
					<article className="container">
						<div className="prose dark:prose-invert prose-lg mx-auto w-full max-w-4xl">
							{bodyContent}
						</div>
						{/* <div className="opacity-50">
							<LandingPage />
						</div> */}
					</article>
				</section>
				{/* <section>
					<div className="container items-center justify-center pb-10 pt-16">
						<PrimaryNewsletterCta className="mx-auto max-w-3xl" />
					</div>
				</section> */}
			</div>
		</LayoutClient>
	)
}

export default Home
