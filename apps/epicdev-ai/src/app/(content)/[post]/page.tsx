import React, { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import { courseBuilderAdapter, db } from '@/db'
import { products } from '@/db/schema'
import { commerceEnabled } from '@/flags'
import { getCachedListForPost } from '@/lib/lists-query'
import { type Post } from '@/lib/posts'
import { getCachedPostOrList } from '@/lib/posts-query'
import { getSaleBannerData } from '@/lib/sale-banner'
import { hasPurchasedProduct } from '@/lib/user-has-product'
import { getCachedVideoResource } from '@/lib/video-resource-query'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, eq } from 'drizzle-orm'
import { ChevronLeft, Github } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import {
	ContentResourceResource,
	type VideoResource,
} from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import { ActiveEventBanner } from '../events/_components/active-event'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import PostToC from '../posts/_components/post-toc'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'
import { PostBodyErrorBoundary } from './_components/post-body-error-boundary'
import PostTranscript from './_components/post-transcript'

type Props = {
	params: Promise<{ post: string }>
}

export default async function PostPage(props: {
	params: Promise<{ post: string }>
}) {
	const params = await props.params
	const post = await getCachedPostOrList(params.post)

	if (!post) {
		notFound()
	}

	if (post.type === 'list') {
		return <ListPage list={post} params={{ slug: params.post } as any} />
	}

	let list = null
	if (post && post.type === 'post') {
		list = await getCachedListForPost(params.post)
	}

	const primaryVideo = post?.resources?.find(
		({ resource }: ContentResourceResource) =>
			resource.type === 'videoResource',
	)

	const primaryVideoId = primaryVideo?.resource.id

	const videoDetails = await getCachedVideoResource(primaryVideoId)
	const isCommerceEnabled = await commerceEnabled()
	const { session } = await getServerAuthSession()
	const allCohortProducts = await db.query.products.findMany({
		where: and(eq(products.status, 1), eq(products.type, 'cohort')),
	})
	const productIds = allCohortProducts.map((p) => p.id)

	let defaultCoupon = null
	if (productIds.length > 0) {
		const coupons = await courseBuilderAdapter.getDefaultCoupon(productIds)
		if (coupons?.defaultCoupon) {
			defaultCoupon = coupons.defaultCoupon
		}
	}

	const saleBannerData = await getSaleBannerData(defaultCoupon)

	const userHasPurchased =
		defaultCoupon?.restrictedToProductId && session?.user?.id
			? await hasPurchasedProduct(
					defaultCoupon.restrictedToProductId,
					session.user.id,
				)
			: false

	const shouldShowSaleBanner =
		defaultCoupon && saleBannerData && isCommerceEnabled && !userHasPurchased

	return (
		<main className="w-full">
			{shouldShowSaleBanner ? (
				<Link
					className="text-primary dark:border-foreground/5 mx-auto mb-2 flex max-w-full items-center justify-between gap-1 rounded-lg border border-violet-500/20 bg-violet-100 px-3 py-1 pr-2 text-xs font-medium shadow-md shadow-violet-600/10 sm:justify-center sm:pr-1 sm:text-sm dark:bg-violet-500/20 dark:shadow-none"
					href={saleBannerData.productPath}
					prefetch
				>
					<div className="flex flex-col sm:block">
						<span className="font-bold">Save {saleBannerData.percentOff}%</span>{' '}
						on {saleBannerData.productName}.{' '}
					</div>
					<div className="bg-linear-to-b font-heading from-primary ml-1 rounded-sm to-indigo-800 px-2 py-0.5 text-sm font-semibold text-white transition ease-out group-hover:underline">
						Get Your Ticket
					</div>
				</Link>
			) : null}
			{primaryVideo && (
				<PlayerContainer videoDetails={videoDetails} post={post} />
			)}
			<div className={cn('relative w-full pt-6 sm:pt-10')}>
				<Suspense fallback={null}>
					<PostActionBar post={post} />
				</Suspense>

				<div className="relative z-10 mx-auto flex w-full items-center justify-center pb-5">
					{!list ? (
						<Link
							href="/posts"
							className="hover:text-primary mb-3 inline-flex items-center text-base font-medium transition ease-in-out"
						>
							<ChevronLeft className="mr-1 size-3" /> All Posts
						</Link>
					) : (
						<div />
					)}
				</div>

				<div className="relative z-10">
					<article className="relative flex h-full flex-col">
						<div className="mx-auto flex w-full flex-col items-center justify-center gap-5 pb-10">
							<PostTitle post={post} />
							<div className="relative mb-3 flex w-full items-center justify-center gap-3">
								<div className="flex w-full items-center justify-center gap-8">
									<Contributor className=" " />
									{post.fields?.github && (
										<Button
											asChild
											variant="outline"
											className="h-11 text-base"
										>
											<Link href={post.fields?.github} target="_blank">
												<Github className="text-muted-foreground mr-2 h-4 w-4" />
												Source Code
											</Link>
										</Button>
									)}
								</div>
							</div>
						</div>
						{post?.type === 'post' && post?.fields?.body && (
							<PostToC markdown={post?.fields?.body} />
						)}
						<PostBodyErrorBoundary post={post}>
							<PostBody post={post} />
						</PostBodyErrorBoundary>
						{/* {listSlugFromParam && (
									<PostProgressToggle
										className="flex w-full items-center justify-center"
										postId={post.id}
									/>
								)} */}
						<ActiveEventBanner className="mx-auto mt-16 w-full max-w-3xl" />
						{!primaryVideo && (
							<PrimaryNewsletterCta
								isHiddenForSubscribers
								className="pt-5 sm:pt-10"
								trackProps={{
									event: 'subscribed',
									params: {
										post: post.fields.slug,
										location: 'post',
									},
								}}
							/>
						)}
						<div className="mx-auto flex w-full flex-wrap items-center justify-center gap-5 py-16">
							<strong className="text-lg font-semibold">Share</strong>
							<Share
								className="inline-flex rounded-md border"
								title={post?.fields.title}
							/>
						</div>
						<div className="mx-auto w-full max-w-3xl pb-10">
							<PostTranscript transcript={videoDetails?.transcript} />
						</div>

						<PostNextUpFromListPagination postId={post.id} />
					</article>
				</div>
			</div>
			{/* {ckSubscriber && product && allowPurchase && pricingDataLoader ? (
						<section id="buy">
							<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-semibold">
								Get Really Good At Node.js
							</h2>
							<div className="flex items-center justify-center border-y">
								<div className="bg-background flex w-full max-w-md flex-col border-x p-8">
									<PricingWidget
										quantityAvailable={-1}
										pricingDataLoader={pricingDataLoader}
										commerceProps={{ ...commerceProps }}
										product={product}
									/>
								</div>
							</div>
						</section>
					) : hasVideo ? null : ( */}
		</main>
	)
}

async function PostBody({ post }: { post: Post | null }) {
	if (!post) {
		return null
	}

	if (!post.fields.body) {
		return null
	}

	// Separate the compilation from JSX rendering
	let content
	try {
		const result = await compileMDX(post.fields.body)
		content = result.content
	} catch (error) {
		// Log the error on the server side where it belongs
		log.error('MDX compilation failed', {
			error: error instanceof Error ? error.message : String(error),
			postId: post.id,
			postSlug: post.fields.slug,
		})

		// Re-throw the error so the error boundary can catch it
		throw error
	}

	return (
		<div className="">
			<article className="prose dark:prose-a:text-primary prose-a:text-primary sm:prose-lg lg:prose-xl mx-auto max-w-3xl">
				{content}
			</article>
		</div>
	)
}

async function PostTitle({ post }: { post: Post | null }) {
	return (
		<h1 className="sm:fluid-3xl fluid-2xl mb-4 w-full text-center font-bold tracking-tight dark:text-white">
			<ReactMarkdown
				components={{
					p: ({ children }) => children,
					code: ({ children }) => (
						<code className="bg-muted/80 rounded px-1 text-[85%]">
							{children}
						</code>
					),
				}}
			>
				{post?.fields?.title}
			</ReactMarkdown>
		</h1>
	)
}

async function PlayerContainer({
	post,
	videoDetails,
}: {
	post: Post | null
	videoDetails: VideoResource | null
}) {
	if (!post) {
		notFound()
	}

	const showNewsletterCta = true

	return videoDetails ? (
		<VideoPlayerOverlayProvider>
			<Suspense
				fallback={
					<PlayerContainerSkeleton className="aspect-video h-full max-h-[75vh] w-full bg-black" />
				}
			>
				<>
					<section
						aria-label="video"
						className={cn(
							'flex flex-col items-center justify-center rounded-md bg-black shadow-md',
							{
								'mb-6 sm:mb-10': !showNewsletterCta,
							},
						)}
					>
						<PostPlayer
							title={post.fields?.title}
							thumbnailTime={post.fields?.thumbnailTime || 0}
							postId={post.id}
							className={cn(
								'aspect-video h-full max-h-[75vh] w-full overflow-hidden rounded-md',
							)}
							videoResource={videoDetails}
						/>
					</section>
					{showNewsletterCta && (
						<PostNewsletterCta
							trackProps={{
								event: 'subscribed',
								params: {
									location: 'post-below-video',
									post: post.fields.slug,
								},
							}}
						/>
					)}
				</>
			</Suspense>
		</VideoPlayerOverlayProvider>
	) : null
}

// export async function generateStaticParams() {
// 	const posts = await getCachedAllPosts()

// 	return posts
// 		.filter((resource) => Boolean(resource.fields?.slug))
// 		.map((resource) => ({
// 			post: resource.fields?.slug,
// 		}))
// }

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params

	const resource = await getCachedPostOrList(params.post)

	if (!resource) {
		return parent as Metadata
	}

	return {
		title: resource.fields.title,
		description: resource.fields.description,
		openGraph: {
			images: [
				getOGImageUrlForResource({
					fields: { slug: resource.fields.slug },
					id: resource.id,
					updatedAt: resource.updatedAt,
				}),
			],
		},
	}
}
async function PostActionBar({ post }: { post: Post | null }) {
	const { ability } = await getServerAuthSession()

	return (
		<>
			{post && ability.can('update', 'Content') ? (
				<Button asChild size="sm" className="absolute right-0 top-0 z-20">
					<Link href={`/posts/${post.fields?.slug || post.id}/edit`}>Edit</Link>
				</Button>
			) : null}
		</>
	)
}
