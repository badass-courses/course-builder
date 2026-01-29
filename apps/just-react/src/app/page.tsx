import React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import Noise from '@/components/brand/noise'
import LayoutClient from '@/components/layout-client'
import { SubscribeFormWithStatus } from '@/components/subscribe-form-with-status'
import config from '@/config'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
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

	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			isCommerceEnabled={isCommerceEnabled}
			withContainer={false}
		>
			<Noise />
			<div className="">
				<section className="mx-auto w-full">
					<div className="min-h-fullscreen grid grid-cols-2 grid-rows-2 px-[12vw] py-[17dvh] sm:px-[15vw]">
						<div className="flex flex-col">
							<h1 className="font-heading leading-0 text-5xl lg:text-6xl">
								{h1?.text || page?.fields.title}
							</h1>
							{h2 && (
								<h2
									className={cn('mt-4 font-serif text-base lg:text-lg', {
										'pl-4': h1?.text?.startsWith('J'),
									})}
								>
									{h2.text}
								</h2>
							)}
						</div>
						<div className="col-start-2 row-start-2 flex items-end justify-end pb-5">
							<Image
								src={'/assets/eye@2x.png'}
								alt=""
								aria-hidden={true}
								width={478 / 2}
								quality={100}
								height={283 / 2}
							/>
						</div>
					</div>
				</section>
				<section className="px-8 pb-48 sm:px-[15vw]">
					<article className="prose prose-themed prose-code:text-sm dark:prose-invert prose-lg mr-auto w-full max-w-2xl pt-5 lg:text-xl">
						{body.content}
					</article>
					<div className="mt-12 max-w-2xl">
						<SubscribeFormWithStatus className="flex flex-col items-start gap-2 font-serif text-xl font-semibold sm:flex-row sm:items-end" />
					</div>
				</section>
			</div>
		</LayoutClient>
	)
}

export default Home
