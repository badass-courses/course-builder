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
			withContainer={false}
			// className="font-serif"
		>
			<div className="">
				<section className="mx-auto w-full">
					<div className="min-h-fullscreen grid grid-cols-2 grid-rows-2 px-[12vw] py-[17dvh] sm:px-[15vw]">
						<div className="flex flex-col">
							<SplitText
								splitBy="chars"
								as="h1"
								className="font-heading text-primary leading-0 text-5xl font-bold lg:text-7xl"
							>
								{h1?.text || page?.fields.title}
							</SplitText>
							{h2 && (
								<SplitText
									splitBy="chars"
									as="h2"
									className={cn('text-primary text-base lg:text-lg', {
										'pl-6': h1?.text?.startsWith('J'),
									})}
								>
									{h2.text}
								</SplitText>
							)}
						</div>
						<div className="col-span-2 col-start-1 row-start-2 flex items-end justify-end pb-5 md:col-span-1 md:col-start-2">
							<HeroVideo />
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
				<section className="scroll-mt-8 px-8 pb-48 sm:px-[15vw]" id="posts">
					{posts.length > 0 && (
						<div className="mb-[20dvh]">
							<h2 className="font-heading mb-6 text-sm font-medium uppercase tracking-wider">
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
