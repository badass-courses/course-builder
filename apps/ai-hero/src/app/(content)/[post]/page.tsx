import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
// import { PricingWidget } from '@/components/home-pricing-widget'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import { ListSchema, type List } from '@/lib/lists'
import { getAllLists, getMinimalListForNavigation } from '@/lib/lists-query'
import { type Post } from '@/lib/posts'
import { getAllPosts, getCachedPostOrList, getPost } from '@/lib/posts-query'
// import { getPricingProps } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { Github } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'
import PostProgressToggle from './_components/post-progress-toggle'

export const experimental_ppr = true

type Props = {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PostPage(props: {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params

	const listSlugFromParam = searchParams.list

	const post = await getCachedPostOrList(params.post)

	if (!post) {
		notFound()
	}

	if (post?.type === 'list') {
		const list = ListSchema.safeParse(post)

		if (!list.success) {
			notFound()
		}

		return (
			<ListPage
				list={list.data}
				params={{ slug: params.post } as any}
				searchParams={searchParams as any}
			/>
		)
	}

	const squareGridPattern = generateGridPattern(
		post.fields.title,
		1000,
		800,
		0.8,
		false,
	)

	const hasVideo = post?.resources?.find(
		({ resource }) => resource.type === 'videoResource',
	)

	return (
		<main className="w-full">
			{hasVideo && <PlayerContainer post={post} />}
			<div
				className={cn(
					'container relative max-w-screen-xl pb-16 sm:pb-24 md:px-10 lg:px-16',
					{
						'pt-16': !hasVideo,
					},
				)}
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
						className="hidden h-[400px] w-full overflow-hidden object-cover object-right-top opacity-[0.05] saturate-0 sm:flex dark:opacity-[0.15]"
					/>
					<div
						className="to-background via-background absolute left-0 top-0 z-10 h-full w-full bg-gradient-to-bl from-transparent"
						aria-hidden="true"
					/>
				</div>
				<div className="relative z-10 flex w-full items-center justify-between">
					{!listSlugFromParam ? (
						<Link
							href="/posts"
							className="text-foreground/75 hover:text-foreground mb-3 inline-flex text-sm transition duration-300 ease-in-out"
						>
							← Posts
						</Link>
					) : (
						<div />
					)}
				</div>
				<div className="relative z-10">
					<article className="flex h-full flex-col gap-5">
						<PostTitle post={post} />
						<div className="relative flex w-full items-center justify-between gap-3">
							<div className="flex items-center gap-8">
								<Contributor className="flex [&_img]:w-8" />
								{post.fields?.github && (
									<Button asChild variant="outline" className="h-11 text-base">
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
						<PostBody post={post} />
						{/* {listSlugFromParam && (
								<PostProgressToggle
									className="flex w-full items-center justify-center"
									postId={post.id}
								/>
							)} */}
						<PostNextUpFromListPagination postId={post.id} />
						<div className="mx-auto mt-10 flex w-full max-w-[290px] flex-col gap-1">
							<strong className="w-full text-center text-lg font-semibold">
								Share
							</strong>
							<Share
								className="bg-background w-full"
								title={post?.fields.title}
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
			{!hasVideo && (
				<PrimaryNewsletterCta
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
		<article className="prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl mt-10 max-w-none [&_[data-pre]]:max-w-4xl">
			{content}
		</article>
	)
}

async function PostTitle({ post }: { post: Post | null }) {
	return (
		<h1 className="fluid-3xl mb-4 font-bold">
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
					<PlayerContainerSkeleton className="h-full max-h-[75vh] w-full bg-black" />
				}
			>
				<section
					aria-label="video"
					className="mb-10 flex flex-col items-center justify-center border-b bg-black"
				>
					<PostPlayer
						title={post.fields?.title}
						thumbnailTime={post.fields?.thumbnailTime || 0}
						postId={post.id}
						className="aspect-video h-full max-h-[75vh] w-full max-w-full overflow-hidden"
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
	const searchParams = await props.searchParams

	const resource = await getCachedPostOrList(params.post)

	if (!resource) {
		return parent as Metadata
	}

	return {
		title: resource.fields.title,
		description: resource.fields.description,
		alternates: {
			canonical:
				searchParams && searchParams.list
					? `/${resource.fields.slug}`
					: undefined,
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
