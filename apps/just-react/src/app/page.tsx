import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import HeroVideo from '@/components/brand/hero-video'
import Noise from '@/components/brand/noise'
import { DirectionalHoverList } from '@/components/directional-hover-list'
import LayoutClient from '@/components/layout-client'
import SplitText from '@/components/split-text'
import config from '@/config'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { getCachedAllPosts } from '@/lib/posts-query'
import { getSaleBannerDataFromSearchParams } from '@/lib/sale-banner'
import { compileMDX } from '@/utils/compile-mdx'
import { extractHeroHeadings } from '@/utils/extract-hero-headings'

import { cn } from '@coursebuilder/ui/utils/cn'

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

	const { h1, h2, bodyWithoutHeadings } = await extractHeroHeadings(
		page?.fields.body ?? '',
	)
	const body = await compileMDX(bodyWithoutHeadings)
	const posts = await getCachedAllPosts()

	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
			withContainer // ={false}
			className="marketing-page"
		>
			<div className="">
				<section className="mx-auto w-full">
					<div className="flex flex-col items-center justify-between pt-16 md:flex-row md:pt-[5dvh]">
						<div className="flex flex-col items-center md:items-start">
							<SplitText
								splitBy="chars"
								as="h1"
								className="font-heading leading-0 text-5xl font-bold tracking-tight lg:text-7xl"
							>
								{h1?.text || page?.fields.title}
							</SplitText>
							{h2 && (
								<SplitText
									splitBy="chars"
									as="h2"
									className={cn('text-base lg:text-lg', {
										'': h1?.text?.startsWith('J'),
									})}
								>
									{h2.text}
								</SplitText>
							)}
						</div>
						<div className="flex items-start justify-end py-5 md:py-0">
							<HeroVideo className="-mr-3 md:-mr-10" />
							{/* <Image
								src={'/assets/eye@2x.png'}
								alt=""
								aria-hidden={true}
								width={478 / 2}
								quality={100}
								height={283 / 2}
							/> */}
						</div>
					</div>
				</section>
				<section className="pb-48">
					{posts.length > 0 && (
						<div className="flex flex-col pb-16 pt-10 md:pt-24">
							<h2
								className="mb-2 scroll-mt-8 font-mono text-xs font-medium uppercase tracking-wider"
								id="posts"
							>
								Latest Posts
							</h2>
							<DirectionalHoverList posts={posts} />
						</div>
					)}
					<article className="prose prose-themed dark:prose-invert prose-lg mr-auto w-full max-w-2xl pt-5">
						{body.content}
					</article>
				</section>
			</div>
			<Noise />
		</LayoutClient>
	)
}

export default Home
