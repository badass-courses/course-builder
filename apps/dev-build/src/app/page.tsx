import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import HomeFeed from '@/components/landing/home-feed'
import LandingContent from '@/components/landing/landing-content'
import LayoutClient from '@/components/layout-client'
import SplitText from '@/components/split-text'
import TickerDraggable from '@/components/ticker-scroll'
import config from '@/config'
import { commerceEnabled } from '@/flags'
import { getFeed } from '@/lib/feed-query'
import { getActiveCoupon, getSaleBannerData } from '@/lib/sale-banner'

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
	const isCommerceEnabled = await commerceEnabled()
	const searchParams = await props.searchParams
	const activeCoupon = await getActiveCoupon(searchParams)
	const saleBannerData = await getSaleBannerData(activeCoupon)
	const feedLoader = getFeed()

	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
		>
			<div className="divide-y">
				<section className="relative">
					<div className="container relative flex w-full flex-col items-center justify-center overflow-hidden border-x py-20 sm:py-24 lg:py-40">
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
								<SplitText
									as="h1"
									className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
								>
									Get Really Good at AI–Powered Development
								</SplitText>
								<h2 className="text-muted-foreground mt-2 max-w-2xl font-sans text-lg font-normal sm:text-xl lg:text-2xl">
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
							</div>
						</div>
					</div>
				</section>
				<section>
					<div className="px-0! container border-x">
						<HomeFeed feedLoader={feedLoader} />
					</div>
				</section>
				<section>
					<div className="px-0! container flex border-x">
						<TickerDraggable />
					</div>
				</section>
				<LandingContent />
			</div>
		</LayoutClient>
	)
}

export default Home
