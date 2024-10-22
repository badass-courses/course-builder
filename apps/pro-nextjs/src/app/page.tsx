import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import Footer from '@/components/app/footer'
import { Instructor } from '@/components/landing-copy'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { getPage } from '@/lib/pages-query'
import { getPricingProps } from '@/lib/pricing-query'
import MuxPlayer from '@mux/mux-player-react'
import { BarChart, Wrench, Zap } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

export async function generateMetadata(
	{ searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	let ogImageUrl = `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent('Pro Next.js by Jack Herrington')}&image=https://res.cloudinary.com/pro-nextjs/image/upload/v1720601718/workshops/c6dea77d-45d4-4720-9935-863b5d2bede6/xr0s0tsdv8noxqcafpc4.png`
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
				'https://res.cloudinary.com/pro-nextjs/image/upload/v1723783882/golden-ticket_2x_qvicr9.jpg'
	}

	return {
		title: {
			template: '%s | ProNext.js',
			default: `The No-BS Solution for Enterprise-Ready Next.js Applications`,
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
	const page = await getPage(
		allowPurchase ? 'home-selling-live~pmxxy' : 'page-16xsv',
	)

	return (
		<div className="">
			<header className="relative mx-auto flex w-full flex-col items-center justify-center">
				<Image
					src={require('../../public/assets/hero.png')}
					alt=""
					aria-hidden="true"
					priority
					width={1297 / 3}
					height={1195 / 3}
					quality={100}
					className="pointer-events-none relative z-20 select-none lg:z-50 lg:-mt-16"
				/>
				{/* <Image
					src={require('../../public/assets/bg.svg')}
					alt=""
					aria-hidden="true"
					fill
					className="object-cover object-bottom"
				/> */}
				<div className="relative z-10 -mt-10 flex flex-col items-center justify-center px-5">
					<h1 className="leading-0 font-heading sm:fluid-3xl fluid-2xl w-full max-w-4xl text-center font-bold">
						The No-BS Solution for Enterprise-Ready Next.js Applications
					</h1>
					<h2 className="font-heading sm:fluid-lg fluid-base text-muted-foreground mb-5 mt-7 items-center text-balance text-center font-normal !tracking-tight sm:inline-flex">
						Professional Next.js Course by{' '}
						<Image
							src={require('../../public/jack-herrington.jpg')}
							alt={config.author}
							priority
							className="ml-2 mr-1 inline-block rounded-full"
							width={32}
							quality={100}
							height={32}
						/>{' '}
						Jack Herrington
					</h2>
				</div>
			</header>

			<main className="mx-auto w-full pt-5 sm:pt-16">
				<article className="prose sm:prose-lg prose-p:mx-auto prose-headings:mx-auto prose-ul:mx-auto prose-img:mx-auto prose-h2:text-center prose-p:max-w-[45rem] prose-headings:max-w-[45rem] prose-ul:max-w-[45rem] mx-auto w-full max-w-none px-6 sm:px-10">
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{ Instructor, Zap, Wrench, BarChart, MuxPlayer }}
						/>
					) : null}
				</article>
				{product && allowPurchase && pricingDataLoader ? (
					<>
						<section id="buy" className="mt-10 sm:mt-24">
							<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-bold">
								Get Really Good At Next.js
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
				) : (
					<>
						<PrimaryNewsletterCta className="mt-16" />
						<div className="flex w-full items-center justify-center">
							<Instructor className="sm:prose-lg prose mx-auto w-full max-w-none px-6 py-6 sm:py-16" />
						</div>
					</>
				)}
			</main>
			<Footer />
		</div>
	)
}

export default Home
