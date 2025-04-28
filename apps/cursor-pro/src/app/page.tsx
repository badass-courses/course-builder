import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import {
	SubscribeForm,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage, ThemeImage } from '@/components/cld-image'
import MDXVideo from '@/components/content/mdx-video'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import MuxPlayer from '@mux/mux-player-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

import {
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
	const page = await getPage('root')
	const searchParams = await props.searchParams
	let ogImageUrl = config?.openGraph?.images?.[0]!.url
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
		title: page?.fields?.title,
		description: page?.fields?.description,
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
	const page = await getPage('root')
	const isCommerceEnabled = await commerceEnabled()

	const firstPageResource = page?.resources?.[0] && {
		path: page.resources[0]?.resource?.fields?.slug,
		title: page.resources[0]?.resource?.fields?.title,
		type: page.resources[0]?.resource?.fields?.postType,
	}

	return (
		<LayoutClient
			className="static"
			highlightedResource={firstPageResource}
			withContainer
		>
			<main className="w-full">
				{firstPageResource && (
					<Link
						className="text-primary dark:border-foreground/5 mx-auto flex max-w-full items-center justify-center gap-1 rounded-full border border-violet-500/20 bg-violet-100 px-3 py-1 text-sm font-medium shadow-md shadow-violet-600/10 dark:bg-violet-500/20 dark:shadow-none"
						href={firstPageResource.path}
						prefetch
					>
						<span className="truncate overflow-ellipsis">
							New {firstPageResource.type}:{' '}
							<span className="underline">{firstPageResource?.title}</span>
						</span>
					</Link>
				)}
				<header className="">
					<h1 className="bg-foreground text-background relative inline-flex w-auto px-1 text-lg font-bold">
						{page?.fields?.title || 'Title'}
					</h1>
					{/* <Contributor className="mt-1 flex items-center [&_img]:size-6 [&_img]:rounded-sm [&_span]:text-base">
						with
					</Contributor> */}
					{/* {page?.fields?.image && (
						<CldImage
							src={page.fields.image}
							alt={page.fields.title}
							width={1955 / 2}
							height={811 / 2}
							className="mx-auto mt-16 w-full rounded-2xl shadow-2xl"
							priority
						/>
					)} */}
				</header>
				<article
					className={cn(
						'prose sm:prose-IDE prose-hr:overflow-hidden dark:prose-invert mx-auo prose-hr:my-3 prose-hr:relative prose-hr:border-0 prose-hr:h-5 prose-hr:opacity-50 prose-hr:before:content-["..................................................................................................................."] w-full max-w-none pb-10',
					)}
				>
					{page?.fields?.body ? (
						<MDXRemote
							source={page?.fields?.body}
							components={{
								CenteredTitle,
								Instructor,
								Spacer,
								Section,
								CheckList,
								Testimonial,
								CldImage: (props) => <CldImage {...props} />,
								SubscribeForm,
								ThemeImage: (props) => <ThemeImage {...props} />,
								PrimaryNewsletterCta: (props) => (
									<PrimaryNewsletterCta
										resource={firstPageResource}
										className={cn('pb-10 sm:pb-16', props.className)}
										trackProps={{
											event: 'subscribed',
											params: {
												location: 'home',
											},
										}}
										{...props}
									/>
								),
								// @ts-expect-error
								MuxPlayer,
								Video: ({ resourceId }: { resourceId: string }) => (
									<MDXVideo resourceId={resourceId} />
								),
							}}
						/>
					) : (
						<p>Page body not found</p>
					)}
				</article>
			</main>
		</LayoutClient>
	)
}

export default Home
