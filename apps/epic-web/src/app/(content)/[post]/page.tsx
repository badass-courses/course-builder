import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostPlayer } from '@/app/admin/posts/_components/post-player'
import PostToC from '@/app/admin/posts/_components/post-toc'
import { PostNewsletterCta } from '@/app/admin/posts/_components/post-video-subscribe-form'
import { Contributor } from '@/components/contributor'
// import { PricingWidget } from '@/components/home-pricing-widget'
// import { getPricingProps } from '@/lib/pricing-query'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import { courseBuilderAdapter } from '@/db'
import { type Post } from '@/lib/posts'
import { getAllPosts, getCachedPost } from '@/lib/posts-query'
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

export const experimental_ppr = true

type Props = {
	params: Promise<{ post: string }>
}

export default async function PostPage(props: {
	params: Promise<{ post: string }>
}) {
	const params = await props.params

	const post = await getCachedPost(params.post)

	if (!post) {
		notFound()
	}

	const hasVideo = post.resources?.find(
		({ resource }: ContentResourceResource) =>
			resource.type === 'videoResource',
	)

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
						{post.fields.body && <PostToC markdown={post.fields.body} />}
						<PostBody post={post} />
						<div className="mx-auto flex w-full flex-wrap items-center justify-center gap-5 py-16">
							<strong className="text-lg font-semibold">Share</strong>
							<Share
								className="inline-flex rounded-md border"
								title={post.fields.title}
							/>
						</div>
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

async function PostBody({ post }: { post: Post | null }) {
	if (!post) {
		return null
	}

	if (!post.fields.body) {
		return null
	}

	const { content } = await compileMDX(post.fields.body)

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

	return posts
		.filter((post) => Boolean(post.fields?.slug))
		.map((post) => ({
			post: post.fields?.slug,
		}))
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params

	const post = await getCachedPost(params.post)

	if (!post) {
		return parent as Metadata
	}

	return {
		title: post.fields.title,
		description: post.fields.description,
		alternates: {
			canonical: `/${post.fields.slug}`,
		},
		openGraph: {
			images: [
				getOGImageUrlForResource({
					fields: { slug: post.fields.slug },
					id: post.id,
					updatedAt: post.updatedAt,
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
