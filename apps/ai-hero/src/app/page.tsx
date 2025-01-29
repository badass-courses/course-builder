import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { PricingWidgetServer } from '@/app/_components/pricing-widget-server'
import { TeamPricingWidget } from '@/app/_components/team-pricing-widget'
import { Testimonial } from '@/app/admin/pages/_components/page-builder-mdx-components'
import { AnimatedTitle } from '@/components/animated-word'
import LandingCopy from '@/components/landing-copy'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter } from '@/db'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import MuxPlayer from '@mux/mux-player-react'
import { ChevronRight } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import { Badge } from '@coursebuilder/ui'

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
			<main className="flex w-full flex-col justify-center pt-10 sm:pt-16">
				<Link
					className="mx-auto mb-5 flex items-center justify-center"
					href="/vercel-ai-sdk-tutorial"
				>
					<Badge className="dark:bg-primary mx-auto flex items-center gap-1 overflow-hidden rounded-full bg-orange-600 p-0">
						<span className="bg-background/10 flex px-2 py-1">Out Now</span>
						<span className="flex items-center gap-1 px-2 pr-3">
							Free Vercel AI SDK Tutorial <ChevronRight className="w-3" />
						</span>
					</Badge>
				</Link>
				<article className="prose prose-h1:text-center prose-h1:max-w-5xl sm:prose-h1:fluid-4xl prose-h1:fluid-2xl sm:prose-lg lg:prose-xl prose-headings:mx-auto prose-headings:max-w-3xl prose-p:mx-auto prose-p:max-w-3xl prose-blockquote:mx-auto prose-blockquote:max-w-3xl prose-ul:mx-auto prose-ul:max-w-3xl prose-img:mx-auto prose-img:max-w-3xl mx-auto max-w-none px-5 pb-8 sm:pb-16">
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{
								AnimateWordChange: (props) => <AnimatedTitle {...props} />,
								CenteredTitle,
								Instructor,
								BlueSection,
								Spacer,
								Section,
								CheckList,
								Testimonial,
								// @ts-expect-error
								MuxPlayer,
							}}
						/>
					) : (
						<LandingCopy />
					)}
				</article>
				{isCommerceEnabled && (
					<section
						id="buy"
						className="container mx-auto flex w-full flex-wrap justify-center gap-16 rounded py-16 sm:border"
					>
						<div className="w-full max-w-sm">
							<PricingWidgetServer
								productId="ai-hero-pro-membership-7564c"
								searchParams={await props.searchParams}
							/>
						</div>
						<div className="w-full max-w-sm">
							<TeamPricingWidget />
						</div>
					</section>
				)}
				<PrimaryNewsletterCta className="px-5 pt-10" />
			</main>
		</div>
	)
}

export default Home
