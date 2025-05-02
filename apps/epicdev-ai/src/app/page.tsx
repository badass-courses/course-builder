import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import {
	SubscribeForm,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage, ThemeImage } from '@/components/cld-image'
import MDXVideo from '@/components/content/mdx-video'
import LayoutClient from '@/components/layout-client'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { commerceEnabled } from '@/flags'
import { getPage } from '@/lib/pages-query'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { getResourcePath } from '@/utils/resource-paths'
import MuxPlayer from '@mux/mux-player-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'

import {
	Callout,
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
		title: {
			template: '%s | Epic AI Pro',
			default: `Epic AI Pro`,
		},
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
		type: page.resources[0]?.resource?.type,
	}

	return (
		<LayoutClient
			className="static"
			highlightedResource={firstPageResource}
			withContainer
		>
			<main className="flex w-full flex-col items-center justify-center">
				{firstPageResource && (
					<Link
						className="text-primary dark:border-foreground/5 mx-auto flex max-w-full items-center justify-center gap-1 rounded-full border border-violet-500/20 bg-violet-100 px-3 py-1 text-sm font-medium shadow-md shadow-violet-600/10 dark:bg-violet-500/20 dark:shadow-none"
						href={getResourcePath(
							firstPageResource.type,
							firstPageResource.path,
							'view',
						)}
						prefetch
					>
						<span className="truncate overflow-ellipsis">
							New {firstPageResource.type}:{' '}
							<span className="underline">{firstPageResource?.title}</span>
						</span>
					</Link>
				)}
				<header>
					<h1 className="sm:fluid-3xl fluid-2xl mb-6 w-full pt-10 text-center font-bold dark:text-white">
						{page?.fields?.title || 'Title'}
					</h1>
				</header>

				<article
					className={cn(
						'prose dark:prose-invert lg:prose-xl sm:prose-lg mx-auo w-full max-w-3xl pb-10',
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
								Callout,
								CldImage: (props) => <CldImage {...props} />,
								SubscribeForm,
								ThemeImage: (props) => <ThemeImage {...props} />,
								PrimaryNewsletterCta: (props) => (
									<PrimaryNewsletterCta
										resource={firstPageResource}
										className={cn('not-prose pb-10 sm:pb-16', props.className)}
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
