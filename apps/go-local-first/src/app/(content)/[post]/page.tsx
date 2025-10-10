import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import { Code } from '@/components/codehike/code'
import Scrollycoding from '@/components/codehike/scrollycoding'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import type { List } from '@/lib/lists'
import { getAllLists, getList, getListForPost } from '@/lib/lists-query'
import { type Post } from '@/lib/posts'
import { getAllPosts, getPost } from '@/lib/posts-query'
import { getPricingProps } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { compileMDX, MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'

type Props = {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
	let resource

	resource = await getPost(params.post)

	if (!resource) {
		resource = await getList(params.post)
	}

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
				<Button asChild size="sm">
					<Link href={`/posts/${post.fields?.slug || post.id}/edit`}>Edit</Link>
				</Button>
			) : null}
		</>
	)
}

async function Post({ post }: { post: Post | null }) {
	if (!post) {
		return null
	}

	if (!post.fields.body) {
		return null
	}

	const { content } = await compileMDX({
		source: post.fields.body,
		// @ts-expect-error
		components: { Code, Scrollycoding },
		options: {
			mdxOptions: {
				remarkPlugins: [
					remarkGfm,
					[
						remarkCodeHike,
						{
							components: { code: 'Code' },
						},
					],
				],
				recmaPlugins: [
					[
						recmaCodeHike,
						{
							components: { code: 'Code' },
						},
					],
				],
			},
		},
	})

	return (
		<article className="prose sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl prose-p:text-foreground/80 **:data-pre:max-w-4xl mt-10 max-w-none">
			{content}
		</article>
	)
}

async function PostTitle({ post }: { post: Post | null }) {
	return (
		<h1 className="fluid-3xl mb-4 inline-flex font-bold">
			{post?.fields?.title}
		</h1>
	)
}

export default async function PostPage(props: {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const post = await getPost(params.post)

	if (!post) {
		return (
			<ListPage
				params={{ slug: params.post } as any}
				searchParams={searchParams as any}
			/>
		)
	}

	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)
	const { allowPurchase, pricingDataLoader, product, commerceProps } =
		ckSubscriber
			? await getPricingProps({ searchParams })
			: {
					allowPurchase: false,
					pricingDataLoader: null,
					product: null,
					commerceProps: null,
				}
	if (!post) {
		notFound()
	}

	const listLoader = getListForPost(post.id)

	// const squareGridPattern = generateGridPattern(
	// 	post.fields.title,
	// 	1000,
	// 	800,
	// 	0.8,
	// 	false,
	// )

	const hasVideo = post?.resources?.find(
		({ resource }) => resource.type === 'videoResource',
	)

	return (
		<main>
			{hasVideo && <PlayerContainer listLoader={listLoader} post={post} />}
			<div
				className={cn('container relative pb-16 sm:pb-24', {
					'pt-16': !hasVideo,
				})}
			>
				<div
					className={cn('absolute right-0 w-full', {
						'-top-10': hasVideo,
						'top-0': !hasVideo,
					})}
				>
					{/* <img
						src={squareGridPattern}
						className="h-[400px] w-full overflow-hidden object-cover object-top-right opacity-[0.15] saturate-0"
					/> */}
					<div
						className="to-background via-background bg-linear-to-bl absolute left-0 top-0 z-10 h-full w-full from-transparent"
						aria-hidden="true"
					/>
				</div>

				<div className="relative z-10 flex w-full items-center justify-between">
					<Link
						href="/posts"
						className="text-foreground/75 hover:text-foreground mb-3 inline-flex text-sm transition duration-300 ease-in-out"
					>
						← Posts
					</Link>
					<div>
						<Suspense fallback={null}>
							<PostActionBar post={post} />
						</Suspense>
					</div>
				</div>
				<div className="relative z-10">
					<article className="flex h-full flex-col gap-5">
						<PostTitle post={post} />
						<Contributor className="flex [&_img]:w-8" />
						<Post post={post} />
						<React.Suspense fallback={<Spinner />}>
							<PostNextUpFromListPagination
								postId={post.id}
								listLoader={listLoader}
							/>
						</React.Suspense>
						<div className="mx-auto mt-10 flex w-full max-w-sm flex-col gap-1">
							<strong className="text-lg font-semibold">Share</strong>
							<Share
								className="bg-background w-full"
								title={post?.fields.title}
							/>
						</div>
					</article>
				</div>
			</div>
			{ckSubscriber && product && allowPurchase && pricingDataLoader ? (
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
			) : hasVideo ? null : (
				<PrimaryNewsletterCta className="pt-20" />
			)}
		</main>
	)
}

async function PlayerContainer({
	post,
	listLoader,
}: {
	post: Post | null
	listLoader: Promise<List | null>
}) {
	const displayOverlay = false

	if (!post) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id

	const videoResource = await courseBuilderAdapter.getVideoResource(resource)
	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	return videoResource ? (
		<VideoPlayerOverlayProvider>
			<Suspense
				fallback={
					<PlayerContainerSkeleton className="h-full max-h-[75vh] w-full bg-black" />
				}
			>
				<section
					aria-label="video"
					className="mb-10 flex flex-col items-center justify-center border-b bg-black"
				>
					<PostPlayer
						postId={post.id}
						listLoader={listLoader}
						className="aspect-video h-full max-h-[75vh] w-full overflow-hidden"
						videoResource={videoResource}
					/>
					{!ckSubscriber && <PostNewsletterCta />}
				</section>
			</Suspense>
		</VideoPlayerOverlayProvider>
	) : resource ? null : null // spacer // <div className="pt-16" />
}
