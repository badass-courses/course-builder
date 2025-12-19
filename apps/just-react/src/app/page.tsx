import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import HomeFeed from '@/components/landing/home-feed'
import LandingContent from '@/components/landing/landing-content'
import LayoutClient from '@/components/layout-client'
import SplitText from '@/components/split-text'
import config from '@/config'
import { commerceEnabled } from '@/flags'
import { getFeed } from '@/lib/feed-query'
import { getPage } from '@/lib/pages-query'
import { getSaleBannerDataFromSearchParams } from '@/lib/sale-banner'
import { compileMDX } from '@/utils/compile-mdx'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	return {
		title: {
			template: '%s | Just React',
			default: `Just React`,
		},
		openGraph: {
			images: [{ url: config.openGraph.images[0]!.url }],
		},
	}
}

type Props = {
	searchParams: Promise<{ [key: string]: string | undefined }>
}

const Home = async (props: Props) => {
	const isCommerceEnabled = await commerceEnabled()
	const searchParams = await props.searchParams
	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)
	const page = await getPage('home')

	const body = await compileMDX(page?.fields.body ?? '')
	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
			withContainer={true}
		>
			<div className="py-8">
				<h1 className="text-4xl font-bold lg:text-5xl">{page?.fields.title}</h1>
				<article className="prose dark:prose-invert prose-lg max-w-none pt-5 lg:text-xl">
					{body.content}
				</article>
			</div>
		</LayoutClient>
	)
}

export default Home
