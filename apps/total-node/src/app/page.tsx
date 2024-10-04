import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import LandingCopy from '@/components/landing-copy'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { getPage } from '@/lib/pages-query'
import { getPricingProps } from '@/lib/pricing-query'
import { cn } from '@/utils/cn'
import MuxPlayer from '@mux/mux-player-react'
import { BarChart, Wrench, Zap } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

export async function generateMetadata(
	{ searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	let ogImageUrl = `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent('Unleash godlike power in your backend development')}`
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
			template: '%s | Total Node',
			default: `Unleash godlike power in your backend development`,
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
			<header className="relative mx-auto flex min-h-[80vh] w-full flex-col items-center justify-center pt-20">
				<Image
					src={require('../../public/hero-1@2x.jpg')}
					fill
					alt=""
					aria-hidden="true"
					className="object-cover opacity-75"
					quality={100}
				/>
				<div
					aria-hidden="true"
					className="bg-primary/20 pointer-events-none absolute z-20 h-80 w-80 rounded-full blur-[150px]"
				/>
				<div className="relative z-10 flex flex-col items-center justify-center px-5 pb-16">
					<h1 className="text-muted-foreground leading-0 font-heading sm:fluid-4xl fluid-2xl w-full max-w-4xl text-center font-bold">
						Unleash godlike power in your backend development
					</h1>
					<h2 className="font-heading sm:fluid-lg fluid-base text-muted-foreground mb-5 mt-7 items-center text-balance text-center font-normal !tracking-tight sm:inline-flex">
						<Image
							src={
								'https://res.cloudinary.com/total-typescript/image/upload/v1728059672/matt-pocock_eyjjli.jpg'
							}
							alt={config.author}
							priority
							className="ml-2 mr-1 inline-block rounded-full"
							width={32}
							height={32}
						/>{' '}
						Matt Pocock
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
				) : (
					<>
						<PrimaryNewsletterCta className="pb-32 pt-10" />
						{/* <div className="flex w-full items-center justify-center">
							<Instructor className="sm:prose-lg prose mx-auto w-full max-w-none px-6 py-6 sm:py-16" />
						</div> */}
					</>
				)}
			</main>
		</div>
	)
}

export default Home

const Instructor = ({ className }: { className?: string }) => {
	return (
		<section
			className={cn('relative flex w-full flex-col items-center', className)}
		>
			<div className="mx-auto flex w-full max-w-screen-lg flex-col items-center sm:gap-10 md:flex-row">
				<div className="not-prose w-auto sm:mx-auto">
					{/* <Image
						src={MattPocockImage}
						alt={config.author}
						width={1200 / 2.6}
						height={853 / 2.6}
						quality={100}
						className="rounded"
					/> */}
				</div>
				<div className="max-w-lg md:px-5">
					<h3>Your Instructor</h3>
					<div
					// className="flex flex-col gap-4 text-lg leading-relaxed"
					>
						<p>TODO</p>
					</div>
				</div>
			</div>
		</section>
	)
}
