import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { PricingWidgetServer } from '@/app/_components/pricing-widget-server'
import { TeamPricingWidget } from '@/app/_components/team-pricing-widget'
import LandingCopy from '@/components/landing-copy'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter } from '@/db'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import MuxPlayer from '@mux/mux-player-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

import {
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
	let ogImageUrl =
		'https://res.cloudinary.com/total-typescript/image/upload/v1730364146/aihero-card_2x_jkg4cs.jpg' // `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent('From Zero to Hero in Node')}`
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
			images: [
				{
					url: ogImageUrl,
				},
			],
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
	const page = await getPage('home-6z2ir')
	const isCommerceEnabled = await commerceEnabled()

	return (
		<div className="">
			<main className="w-full pt-5 sm:pt-16">
				<article className="prose prose-h1:text-center sm:prose-lg lg:prose-xl prose-headings:mx-auto prose-headings:max-w-3xl prose-p:mx-auto prose-p:max-w-3xl prose-blockquote:mx-auto prose-blockquote:max-w-3xl prose-ul:mx-auto prose-ul:max-w-3xl prose-img:mx-auto prose-img:max-w-3xl mx-auto max-w-none px-5 pb-8 sm:pb-16">
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{
								CenteredTitle,
								Instructor,
								BlueSection,
								Spacer,
								Section,
								CheckList,
								// @ts-expect-error
								MuxPlayer,
							}}
						/>
					) : (
						<LandingCopy />
					)}
				</article>
				{isCommerceEnabled && (
					<section id="buy" className="mt-10 sm:mt-24">
						<div className="mx-auto grid max-w-[1400px] grid-cols-1 items-stretch gap-8 border-y px-5 py-16 md:grid-cols-2 md:gap-16">
							<div className="bg-background flex flex-col rounded-xl border p-8 shadow-sm">
								<div className="flex flex-1 flex-col justify-end">
									<PricingWidgetServer
										productId="ai-hero-pro-membership-7564c"
										searchParams={await props.searchParams}
									/>
								</div>
							</div>
							<div className="bg-background flex flex-col rounded-xl border p-8 shadow-sm">
								<div className="flex flex-1 flex-col justify-end">
									<TeamPricingWidget />
								</div>
							</div>
						</div>
					</section>
				)}
				<PrimaryNewsletterCta className="px-5 pt-10" />
			</main>
		</div>
	)
}

export default Home
