import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import {
	FAQ,
	ShinyText,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { AnimatedTitle } from '@/components/brand/animated-word'
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
import { compileMDX } from '@/utils/compile-mdx'
import MuxPlayer from '@mux/mux-player-react'
import { ChevronsRight } from 'lucide-react'
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
			template: '%s | Code with Antonio',
			default: `Build something great! - Code with Antonio`,
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
	const page = await getPage('homepage-default')
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
	const { content: bodyContent } = await compileMDX(page?.fields?.body || '')

	const SaleBanner = () => {
		if (!saleBannerData || !isCommerceEnabled) return null

		return (
			<div className="">
				New{' '}
				{saleBannerData.productType === 'self-paced'
					? `course ・ Save ${saleBannerData.percentOff}% on ${saleBannerData.productName}`
					: `cohort open ・ Register for the "${saleBannerData.productName}" today and save ${saleBannerData.percentOff}%`}
				<ChevronsRight className="size-4" />
			</div>
		)
	}
	return (
		<LayoutClient>
			<main>
				<SaleBanner />
				<section className="bg-primary text-primary-foreground flex w-full flex-col items-center justify-center py-16">
					<div className="max-w-screens-2xl mx-auto w-full">
						<h1 className="text-5xl">
							Build your career on modern full-stack skills
						</h1>
						<h2 className="text-2xl">
							Join cohort-based courses with Antonio and get really good at
							modern development
						</h2>
					</div>
				</section>

				<article className="prose dark:prose-invert">{bodyContent}</article>
			</main>
		</LayoutClient>
	)
}

export default Home
