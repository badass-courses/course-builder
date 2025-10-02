import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import {
	FAQ,
	ShinyText,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { AnimatedTitle } from '@/components/brand/animated-word'
import PixelatedImageCarousel from '@/components/brand/pixelated-image-carousel'
import { CldImage } from '@/components/cld-image'
import { PricingWidgetServer } from '@/components/commerce/pricing-widget-server'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { products } from '@/db/schema'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getSaleBannerData } from '@/lib/sale-banner'
import { cn } from '@/utils/cn'
import MuxPlayer from '@mux/mux-player-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import { Badge } from '@coursebuilder/ui/primitives/badge'

import {
	AIPracticesGrid,
	BlueSection,
	CenteredTitle,
	CheckList,
	Instructor,
	Section,
	Spacer,
} from './admin/pages/_components/page-builder-mdx-components'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const searchParams = await props.searchParams
	let ogImageUrl = config.openGraph.images[0]!.url
	const codeParam = searchParams?.code
	const couponParam = searchParams?.coupon
	const couponCodeOrId = codeParam || couponParam
	if (couponCodeOrId) {
		const coupon = await getCouponForCode(
			couponCodeOrId,
			[],
			courseBuilderAdapter,
		)
		const validCoupon = Boolean(coupon && coupon.isValid)
		if (validCoupon)
			ogImageUrl =
				'https://res.cloudinary.com/total-typescript/image/upload/v1730364326/aihero-golden-ticket_2x_qghsfq.png'
	}

	return {
		title: {
			template: '%s | AI Hero',
			default: `From Zero to AI Hero`,
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
	const page = await getPage(
		isCommerceEnabled ? 'home-selling-live~i7ni0' : 'home-6z2ir',
	)
	const firstPageResource = page?.resources?.[0] && {
		path: page.resources[0]?.resource?.fields?.slug,
		title: page.resources[0]?.resource?.fields?.title,
	}
	const searchParams = await props.searchParams
	const couponCodeOrId = searchParams?.code || searchParams?.coupon
	let validCoupon = null
	let coupon = null
	if (couponCodeOrId) {
		coupon = await getCouponForCode(couponCodeOrId, [], courseBuilderAdapter)
		if (coupon && coupon.isValid) {
			validCoupon = coupon
		}
	}

	const allProducts = await db.select().from(products)
	const productIds = allProducts.map((p) => p.id)

	let defaultCoupon = null
	if (productIds.length > 0) {
		const coupons = await courseBuilderAdapter.getDefaultCoupon(productIds)
		if (coupons?.defaultCoupon) {
			defaultCoupon = coupons.defaultCoupon
		}
	}

	const saleBannerData = await getSaleBannerData(defaultCoupon)

	return (
		<LayoutClient className="max-w-[1030px]" withContainer>
			<main className="flex w-full flex-col justify-center">
				{defaultCoupon && saleBannerData && isCommerceEnabled ? (
					<div className="">
						<Link
							className="bg-background bg-size-[24px_32px] dark:bg-size-[24px_32px] group mx-auto flex w-full flex-wrap items-center justify-center gap-1 border-b bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-light-r_2x_y6fcsw.png)] bg-repeat px-2 py-2 text-center font-sans text-sm font-medium tracking-tight underline-offset-2 dark:bg-[url(https://res.cloudinary.com/total-typescript/image/upload/v1740997576/aihero.dev/assets/side-pattern-dark-r_2x_wytllo.png)]"
							href={saleBannerData.productPath}
							prefetch
						>
							<span className="font-bold">
								Save {saleBannerData.percentOff}%
							</span>{' '}
							on {saleBannerData.productName}.{' '}
							<div className="bg-primary text-primary-foreground ml-1 rounded px-1.5 py-0.5 transition ease-in-out group-hover:underline">
								Get Your Ticket
							</div>
						</Link>
					</div>
				) : (
					firstPageResource && (
						<div className="bg-background flex w-full items-center justify-center border-b py-2 text-center">
							<Link
								className="mx-auto flex items-center justify-center gap-1 font-mono text-xs tracking-tight underline-offset-2"
								href={firstPageResource.path}
								prefetch
							>
								New:{' '}
								<span className="underline">{firstPageResource?.title}</span> ▸
							</Link>
						</div>
					)
				)}

				<header className="relative flex w-full flex-col items-center justify-center px-3 pb-10 pt-10 sm:pb-20 sm:pt-16">
					<div className="absolute -top-16 left-1/3 h-80 w-16 -rotate-12 bg-[#F7ADBC] opacity-50 blur-3xl dark:bg-white dark:opacity-30" />
					<div
						className="pointer-events-none absolute left-0 top-0 h-full w-full select-none opacity-60 mix-blend-overlay"
						style={{
							backgroundImage: 'url(/assets/noise.png)',
							backgroundRepeat: 'repeat',
						}}
					/>
					<div className="relative z-10">
						<AnimatedTitle
							className="mx-auto max-w-6xl text-center text-3xl leading-[0.9] sm:text-[3.2rem] dark:text-white"
							word="Changing"
							words={['Changing', 'Evolving', 'Shifting', 'Advancing']}
						>
							Your Job as a Developer is Changing Faster than You Can Imagine
						</AnimatedTitle>
					</div>
					<h2 className="mt-8 text-center text-xl font-normal opacity-80 sm:text-2xl">
						<ShinyText>Pandora's Box has been opened. AI is here.</ShinyText>
					</h2>
				</header>
				<PixelatedImageCarousel />
				<article
					className={cn(
						'prose dark:prose-invert dark:prose-strong:text-white dark:prose-headings:text-white prose-h2:drop-shadow-[1px_3px_0px_hsl(var(--background))] prose-h1:text-center prose-h2:text-center prose-h2:max-w-3xl prose-h2:text-balance lg:prose-h1:max-w-6xl prose-h1:max-w-4xl xl:prose-h1:text-6xl lg:prose-h1:text-5xl sm:prose-h1:text-4xl prose-h1:text-3xl sm:prose-lg prose-lg lg:prose-2xl prose-headings:mx-auto prose-headings:max-w-4xl prose-p:mx-auto prose-p:max-w-4xl prose-blockquote:mx-auto prose-blockquote:max-w-4xl prose-ul:mx-auto prose-ul:max-w-4xl prose-img:mx-auto prose-img:max-w-4xl mt-10 max-w-none overflow-x-hidden pb-8 sm:overflow-x-visible sm:pb-16 md:mt-16',
						'prose-p:px-5 prose-ul:px-5 prose-headings:px-5', // paddings
						{},
					)}
				>
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{
								AnimatedTitle: (props) => <AnimatedTitle {...props} />,
								CenteredTitle,
								Instructor,
								BlueSection,
								Spacer,
								Section,
								CheckList,
								Testimonial,
								ShinyText,
								CldImage: (props) => <CldImage {...props} />,
								AIPracticesGrid: (props) => (
									<AIPracticesGrid
										items={props.items}
										className="my-6 sm:my-16"
									/>
								),
								PrimaryNewsletterCta: (props) => (
									<PrimaryNewsletterCta
										resource={firstPageResource}
										className={cn('not-prose pb-10 sm:pb-16', props.className)}
										trackProps={{
											event: 'subscribed',
											params: {
												location: 'home',
											},
										}}
									/>
								),
								Pricing: (props) => (
									<React.Suspense
										fallback={
											<div className="flex h-full w-full items-center justify-center px-5 py-10 text-center">
												Loading pricing...
											</div>
										}
									>
										<div className="mt-10 flex flex-col items-center justify-center border-t sm:flex-row">
											<div
												id="buy"
												className="not-prose bg-card mx-auto w-full max-w-md pb-5 pt-3 sm:border-x"
											>
												<PricingWidgetServer
													productId={props.productId || 'product-3vfob'}
													searchParams={searchParams}
													{...props}
												/>
											</div>
										</div>
									</React.Suspense>
								),
								// @ts-expect-error
								MuxPlayer,
								FAQ: () => (
									<React.Suspense fallback={null}>
										<FAQ faqPageLoader={getPage('faq-2ryr6')} />
									</React.Suspense>
								),
							}}
						/>
					) : (
						<>Page body not found</>
					)}
				</article>
				{/* {isCommerceEnabled && (
					<section
						id="buy"
						className="container mx-auto flex w-full items-center justify-center gap-16 border-t py-16"
					>
						<div className="w-full max-w-sm">
							<PricingWidgetServer
								productId="product-3vfob"
								searchParams={await props.searchParams}
							/>
						</div>
						<div className="w-full max-w-sm">
							<TeamPricingWidget />
						</div>
					</section>
				)} */}
			</main>
		</LayoutClient>
	)
}

export default Home
