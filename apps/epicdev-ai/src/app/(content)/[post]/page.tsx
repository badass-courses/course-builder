import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import { courseBuilderAdapter } from '@/db'
import { getAllLists, getCachedListForPost } from '@/lib/lists-query'
import { type Post, type ProductForPostProps } from '@/lib/posts'
import {
	getAllPosts,
	getCachedPostOrList,
	getProductForPost,
} from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { ChevronLeft, Github } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { ContentResourceResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import PostToC from '../posts/_components/post-toc'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'
import {
	EventPricing,
	EventPricingButton,
	EventPricingInline,
} from './_components/event-pricing'

export const experimental_ppr = true

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

	const hasVideo = post?.resources?.find(
		({ resource }: ContentResourceResource) =>
			resource.type === 'videoResource',
	)

	const pricingPropsLoader = getProductForPost(post.id)

	return (
		<main className="w-full">
			{hasVideo && <PlayerContainer post={post} />}
			<div
				className={cn('relative w-full', {
					'pt-6 sm:pt-10': !hasVideo,
				})}
			>
				<Suspense fallback={null}>
					<PostActionBar post={post} />
				</Suspense>
				{post?.fields?.postType !== 'event' && (
					<div className="relative z-10 mx-auto flex w-full items-center justify-center pb-5">
						{!list ? (
							<Link
								href="/posts"
								className="hover:text-primary mb-3 inline-flex items-center text-sm font-medium transition ease-in-out"
							>
								<ChevronLeft className="mr-1 size-3" /> All Posts
							</Link>
						) : (
							<div />
						)}
					</div>
				)}

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
						<PostBody post={post} pricingPropsLoader={pricingPropsLoader} />
						{/* {listSlugFromParam && (
									<PostProgressToggle
										className="flex w-full items-center justify-center"
										postId={post.id}
									/>
								)} */}
						{!hasVideo && post?.fields?.postType !== 'event' && (
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
						{post?.fields?.postType !== 'event' && (
							<PostNextUpFromListPagination postId={post.id} />
						)}
					</article>
				</div>
			</div>
			{/* {ckSubscriber && product && allowPurchase && pricingDataLoader ? (
						<section id="buy">
							<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-bold">
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

async function PostBody({
	post,
	pricingPropsLoader,
}: {
	post: Post | null
	pricingPropsLoader: Promise<ProductForPostProps | null>
}) {
	if (!post) {
		return null
	}

	if (!post.fields.body) {
		return null
	}

	const { content } = await compileMDX(post.fields.body, {
		EventPricing: (props) => (
			<Suspense fallback={<div className="py-5">Loading...</div>}>
				<EventPricingInline
					pricingPropsLoader={pricingPropsLoader}
					post={post}
					{...props}
				/>
			</Suspense>
		),
		BuyTicketButton: (props) => (
			<Suspense fallback={<div className="py-5">Loading...</div>}>
				<EventPricingButton
					pricingPropsLoader={pricingPropsLoader}
					post={post}
					{...props}
				/>
			</Suspense>
		),
	})

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
		<h1 className="sm:fluid-3xl fluid-2xl mb-4 w-full text-center font-bold dark:text-white">
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

async function PlayerContainer({ post }: { post: Post | null }) {
	if (!post) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id

	const videoResource = await courseBuilderAdapter.getVideoResource(resource)
	const showNewsletterCta = post.fields?.postType !== 'event'

	return videoResource ? (
		<VideoPlayerOverlayProvider>
			<Suspense
				fallback={
					<PlayerContainerSkeleton className="aspect-video h-full max-h-[75vh] w-full bg-black" />
				}
			>
				<section
					aria-label="video"
					className="mb-6 flex flex-col items-center justify-center rounded-md bg-black shadow-md sm:mb-10"
				>
					<PostPlayer
						title={post.fields?.title}
						thumbnailTime={post.fields?.thumbnailTime || 0}
						postId={post.id}
						className={cn(
							'aspect-video h-full max-h-[75vh] w-full overflow-hidden rounded-t-md',
							{
								'rounded-b-md': !showNewsletterCta,
							},
						)}
						videoResource={videoResource}
					/>
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
				</section>
			</Suspense>
		</VideoPlayerOverlayProvider>
	) : null
}

export async function generateStaticParams() {
	const posts = await getAllPosts()
	const lists = await getAllLists()

	const resources = [...posts, ...lists]

	return resources
		.filter((resource) => Boolean(resource.fields?.slug))
		.map((resource) => ({
			post: resource.fields?.slug,
		}))
}

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
	const { session, ability } = await getServerAuthSession()

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
