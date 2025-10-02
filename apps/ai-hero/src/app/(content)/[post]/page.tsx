import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
// import { PricingWidget } from '@/components/home-pricing-widget'
// import { getPricingProps } from '@/lib/pricing-query'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import { courseBuilderAdapter } from '@/db'
import { getAllLists, getCachedListForPost } from '@/lib/lists-query'
import { type Post } from '@/lib/posts'
import { getAllPosts, getCachedPostOrList } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { Github } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { ContentResourceResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import PostToC from '../posts/_components/post-toc'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'

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

	const squareGridPattern = generateGridPattern(
		post.fields.title,
		1000,
		800,
		0.8,
		false,
	)

	const hasVideo = post?.resources?.find(
		({ resource }: ContentResourceResource) =>
			resource.type === 'videoResource',
	)

	return (
		<main className="bg-card w-full dark:bg-transparent">
			{hasVideo && <PlayerContainer post={post} />}
			<div
				className={cn('relative w-full', {
					'pt-6 sm:pt-14': !hasVideo,
				})}
			>
				<div
					className={cn('absolute right-0 w-full', {
						'-top-10': hasVideo,
						'top-0': !hasVideo,
					})}
				>
					<img
						alt=""
						aria-hidden="true"
						src={squareGridPattern}
						className="object-top-right hidden h-[400px] w-full overflow-hidden object-cover opacity-[0.05] saturate-0 sm:flex dark:opacity-[0.15]"
					/>
					<div
						className="dark:to-background dark:via-background bg-linear-to-bl absolute left-0 top-0 z-10 h-full w-full from-transparent via-white to-white dark:from-transparent"
						aria-hidden="true"
					/>
				</div>
				<div className="relative z-10 mx-auto flex w-full items-center justify-between px-5 md:px-10 lg:px-14">
					{!list ? (
						<Link
							href="/posts"
							className="text-foreground/75 hover:text-foreground mb-3 inline-flex text-sm transition duration-300 ease-in-out"
						>
							← All Posts
						</Link>
					) : (
						<div />
					)}
				</div>
				<div className="relative z-10">
					<article className="relative flex h-full flex-col">
						<div className="mx-auto flex w-full flex-col gap-5 px-5 md:px-10 lg:px-14">
							<PostTitle post={post} />
							<div className="relative mb-3 flex w-full items-center justify-between gap-3">
								<div className="flex items-center gap-8">
									<Contributor className="flex [&_img]:w-8" />
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
								<Suspense fallback={null}>
									<PostActionBar post={post} />
								</Suspense>
							</div>
						</div>
						{post?.type === 'post' && post?.fields?.body && (
							<PostToC markdown={post?.fields?.body} />
						)}
						<PostBody post={post} />
						{/* {listSlugFromParam && (
									<PostProgressToggle
										className="flex w-full items-center justify-center"
										postId={post.id}
									/>
								)} */}
						{!hasVideo && (
							<PrimaryNewsletterCta
								isHiddenForSubscribers
								className="pt-20"
								trackProps={{
									event: 'subscribed',
									params: {
										post: post.fields.slug,
										location: 'post',
									},
								}}
							/>
						)}
						<div className="mx-auto mt-16 flex w-full flex-wrap items-center justify-center gap-5 border-t pl-5">
							<strong className="text-lg font-semibold">Share</strong>
							<Share
								className="inline-flex rounded-none border-y-0"
								title={post?.fields.title}
							/>
						</div>
						<PostNextUpFromListPagination
							postId={post.id}
							documentIdsToSkip={list?.resources.map(
								(resource) => resource.resource.id,
							)}
						/>
					</article>
				</div>
			</div>
			{/* {ckSubscriber && product && allowPurchase && pricingDataLoader ? (
						<section id="buy">
							<h2 className="text-2xl mb-10 text-balance px-5 text-center font-bold">
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

	const { content } = await compileMDX(post.fields.body)

	return (
		<div className="px-5 md:px-10 lg:px-14">
			<article className="prose dark:prose-invert dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl mt-10 max-w-none">
				{content}
			</article>
		</div>
	)
}

async function PostTitle({ post }: { post: Post | null }) {
	return (
		<h1 className="mb-4 text-2xl font-semibold sm:text-3xl lg:text-4xl dark:text-white">
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

	return videoResource ? (
		<VideoPlayerOverlayProvider>
			<Suspense
				fallback={
					<PlayerContainerSkeleton className="aspect-video h-full max-h-[75vh] w-full bg-black" />
				}
			>
				<section
					aria-label="video"
					className="mb-6 flex flex-col items-center justify-center border-b bg-black sm:mb-10"
				>
					<PostPlayer
						title={post.fields?.title}
						thumbnailTime={post.fields?.thumbnailTime || 0}
						postId={post.id}
						className="aspect-video h-full max-h-[75vh] w-full overflow-hidden"
						videoResource={videoResource}
					/>
					<PostNewsletterCta
						trackProps={{
							event: 'subscribed',
							params: {
								location: 'post-below-video',
								post: post.fields.slug,
							},
						}}
					/>
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
		alternates: {
			canonical: `/${resource.fields.slug}`,
		},
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
				<Button asChild size="sm" className="absolute right-0 top-0 z-50">
					<Link href={`/posts/${post.fields?.slug || post.id}/edit`}>Edit</Link>
				</Button>
			) : null}
		</>
	)
}
