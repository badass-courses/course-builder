import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import Footer from '@/components/app/footer'
import LandingCopy from '@/components/landing-copy'
import { LandingHeroParallax } from '@/components/landing-hero-parallax'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { getPage } from '@/lib/pages-query'
import { getPricingProps } from '@/lib/pricing-query'
import { cn } from '@/utils/cn'
import MuxPlayer from '@mux/mux-player-react'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

import {
	BlueSection,
	CenteredTitle,
	Instructor,
	Section,
	Spacer,
} from './admin/pages/_components/page-builder-mdx-components'

export async function generateMetadata(
	{ searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	let ogImageUrl =
		'https://res.cloudinary.com/total-typescript/image/upload/v1729160439/totalnodejs.com/card-tn_2x_qg1pmy.jpg' // `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent('From Zero to Hero in Node')}`
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
				'https://res.cloudinary.com/total-typescript/image/upload/v1729158523/totalnodejs.com/golden-ticket-tnjs_2x_ggbrxn.png'
	}

	return {
		title: {
			template: '%s | Total Node',
			default: `From Zero to Hero in Node`,
		},
		openGraph: {
			images: [
				{
					url: ogImageUrl,
				},
			],
		},
	}
}

type Props = {
	searchParams: { [key: string]: string | undefined }
}

const Home = async ({ searchParams }: Props) => {
	const { allowPurchase, pricingDataLoader, product, commerceProps } =
		await getPricingProps({ searchParams })
	const page = await getPage(allowPurchase ? 'home-6z2ir' : 'home-6z2ir')
	const cookieStore = cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	return (
		<div className="">
			<header className="relative mx-auto flex aspect-square h-full w-full flex-col items-center justify-start pt-16 lg:aspect-[1920/1080] lg:pt-[7vw]">
				<LandingHeroParallax />
				<div className="relative z-10 flex flex-col items-center justify-center px-5 pb-16">
					<h1 className="font-heading sm:fluid-4xl fluid-3xl w-full max-w-4xl text-balance text-center font-bold text-[#221801] shadow-[#AD9F95] drop-shadow-xl sm:text-black">
						From Zero
						<br />
						to Hero in Node
					</h1>
					{/* <h2 className="font-heading sm:fluid-lg fluid-base mb-5 mt-7 items-center text-balance text-center font-bold uppercase !tracking-widest text-black sm:inline-flex">
						From Zero To Hero
					</h2> */}
				</div>
				<div className="absolute bottom-10 flex items-center justify-center text-white">
					<Image
						src={
							'https://res.cloudinary.com/total-typescript/image/upload/v1728059672/matt-pocock_eyjjli.jpg'
						}
						alt={config.author}
						priority
						className="mr-2 inline-block rounded-full"
						width={36}
						height={36}
					/>{' '}
					{config.author}
				</div>
			</header>

			<main className="w-full pt-5 sm:pt-16">
				<article className="prose sm:prose-lg lg:prose-xl prose-headings:mx-auto prose-headings:max-w-4xl prose-p:mx-auto prose-p:max-w-4xl prose-ul:mx-auto prose-ul:max-w-4xl prose-img:mx-auto prose-img:max-w-4xl mx-auto max-w-none px-5">
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{
								CenteredTitle,
								Instructor,
								BlueSection,
								Spacer,
								Section,
								MuxPlayer,
							}}
						/>
					) : (
						<LandingCopy />
					)}
				</article>
				{product && allowPurchase && pricingDataLoader ? (
					<>
						<section id="buy" className="mt-10 sm:mt-24">
							<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-bold">
								Get Really Good At Node.js
							</h2>
							<div className="flex items-center justify-center border-y">
								<div className="bg-background flex w-full max-w-md flex-col border-x p-8">
									<PricingWidget
										quantityAvailable={-1}
										pricingDataLoader={pricingDataLoader}
										commerceProps={{ ...commerceProps }}
										product={product}
									/>
								</div>
							</div>
						</section>
						<section className="flex items-center justify-center py-10">
							<img
								src={'/assets/money-back-guarantee-badge.svg'}
								width={100}
								height={100}
								alt="30-day money back guarantee"
							/>
						</section>
					</>
				) : ckSubscriber ? null : (
					<PrimaryNewsletterCta className="pt-10" />
				)}
			</main>
		</div>
	)
}

export default Home
