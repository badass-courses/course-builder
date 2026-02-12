import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
	SubscribeForm,
	Testimonial,
} from '@/app/admin/pages/_components/page-builder-mdx-components'
import { CldImage, ThemeImage } from '@/components/cld-image'
import MDXVideo from '@/components/content/mdx-video'
import { JheyProfile } from '@/components/jhey-profile'
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
		title: {
			template: '%s | The Craft of UI',
			default: `The Craft of UI`,
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
		type: page.resources[0]?.resource?.fields?.postType,
	}

	return (
		<LayoutClient
			className="static"
			highlightedResource={firstPageResource}
			withContainer
			withGrid
		>
			<div className="min-h-screen overflow-auto pb-16">
				<div className="mx-auto max-w-3xl px-4 pb-16 pt-16">
					<header className="text-gray-900 dark:text-gray-100">
						<h1 className="mb-4 flex items-center text-sm font-extralight text-gray-800 dark:text-gray-200">
							The Craft of UI — by&nbsp;
							<Link
								aria-label="Jhey Tompkins"
								className="flex items-center gap-x-2 text-gray-600 outline-red-500 transition-colors hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
								href="https://twitter.com/intent/follow?screen_name=jh3yy"
								target="_blank"
							>
								Jhey Tompkins
								<Image
									className="aspect-square w-7 rounded-full bg-gray-500"
									src="/headshot.jpeg"
									alt="Jhey Tompkins"
									width={42}
									height={42}
								/>
							</Link>
						</h1>
						<p className="mb-6 font-serif text-4xl leading-none sm:text-5xl md:text-6xl">
							What if you could build{' '}
							<span className="text-red-500">anything</span>?
						</p>
					</header>

					<main
						className={cn(
							'prose prose-lg dark:prose-invert',
							'[&>p:not(:has(+ul))]:mb-8 [&_p]:text-gray-600 dark:[&_p]:text-gray-300',
							'[&_ul]:mb-8 [&_ul]:mt-2 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-y-2 [&_ul]:pl-6',
							'[&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-normal [&_h2]:leading-none',
							'[&_h2]:mb-4 [&_h2]:mt-20',
						)}
					>
						{firstPageResource && (
							<Link
								className="mx-auto mb-8 flex max-w-full items-center justify-center gap-1 rounded-full border border-violet-500/20 bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 shadow-md shadow-violet-600/10 dark:border-violet-500/20 dark:bg-violet-500/20 dark:text-violet-200 dark:shadow-none"
								href={firstPageResource.path}
								prefetch
							>
								<span className="truncate text-ellipsis">
									New {firstPageResource.type}:{' '}
									<span className="underline">{firstPageResource?.title}</span>
								</span>
							</Link>
						)}

						<article className="mx-auto w-full max-w-3xl pb-10">
							{page?.fields?.body ? (
								<>
									<MDXRemote
										source={page?.fields?.body}
										options={{ blockJS: false }}
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
													className={cn(
														'not-prose pb-10 sm:pb-16',
														props.className,
													)}
													trackProps={{
														event: 'subscribed',
														params: {
															location: 'home',
														},
													}}
													{...props}
												/>
											),
											MuxPlayer: (props) => <MuxPlayer {...props} />,
											Video: ({ resourceId }: { resourceId: string }) => (
												<MDXVideo resourceId={resourceId} />
											),
										}}
									/>
									<JheyProfile />
									<PrimaryNewsletterCta
										title="You want to build exceptional user interfaces, I want to empower you to do so."
										byline="Join the waitlist to learn more and get course launch updates."
										actionLabel="Subscribe"
									/>
								</>
							) : (
								<p>Page body not found</p>
							)}
						</article>
					</main>
				</div>
			</div>
		</LayoutClient>
	)
}

export default Home
