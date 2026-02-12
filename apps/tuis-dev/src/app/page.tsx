import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { CompanyLogos } from '@/components/brand/company-logos'
import {
	HeroBackground,
	SubscribeFormIllustration,
} from '@/components/brand/svgs'
// import { CldImage } from '@/components/cld-image'
import ResourceTeaser from '@/components/content/resource-teaser'
import { HomePage } from '@/components/landing/home-page'
import LayoutClient from '@/components/layout-client'
import { SubscribeFormWithStatus } from '@/components/subscribe-form-with-status'
import config from '@/config'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getActiveCoupon, getSaleBannerData } from '@/lib/sale-banner'
import { getAllWorkshops } from '@/lib/workshops-query'
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
			template: '%s | TUIs.dev',
			default: `Build Beautiful Terminal UIs`,
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
			<HomePage />
		</LayoutClient>
	)
}

export default Home
