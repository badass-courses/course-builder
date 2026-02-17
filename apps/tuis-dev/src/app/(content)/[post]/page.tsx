import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import { AsciiField } from '@/components/landing/ascii-field'
import { AsciiHeart } from '@/components/landing/ascii-heart'
import { Reveal } from '@/components/landing/reveal'
import { SubscribeForm as LandingSubscribeForm } from '@/components/landing/subscribe-form'
import TerminalIllustration from '@/components/landing/terminal-illustration'
import LayoutClient from '@/components/layout-client'
// import { PricingWidget } from '@/components/home-pricing-widget'
// import { getPricingProps } from '@/lib/pricing-query'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import * as Share from '@/components/share'
import { courseBuilderAdapter } from '@/db'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { List } from '@/lib/lists'
import { getAllLists, getCachedListForPost } from '@/lib/lists-query'
import { type Post } from '@/lib/posts'
import { getAllPosts, getCachedPostOrList } from '@/lib/posts-query'
import { getSaleBannerDataFromSearchParams } from '@/lib/sale-banner'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { ArrowLeftIcon, CopyIcon, Github, PencilIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { ContentResourceResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import ModuleResourceList from '../_components/navigation/module-resource-list'
import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import PostToC from '../posts/_components/post-toc'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'
import { CopyAsMarkdown } from './_components/copy-as-markdown'
import { MobileListResourceNavigation } from './_components/list-resource-navigation'

type Props = {
	params: Promise<{ post: string }>
}

export default async function PostPage(props: {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const params = await props.params
	const searchParams = await props.searchParams
	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)
	const post = await getCachedPostOrList(params.post)

	if (!post) {
		notFound()
	}

	if (post.type === 'list') {
		return (
			<ListPage
				list={post}
				params={Promise.resolve({ slug: params.post })}
				searchParams={Promise.resolve(searchParams)}
			/>
		)
	}

	let list = null
	if (post && post.type === 'post') {
		list = await getCachedListForPost(post)
	}

	const hasVideo = Boolean(
		post?.resources?.find(
			({ resource }: ContentResourceResource) =>
				resource.type === 'videoResource',
		),
	)

	return (
		<LayoutClient saleBannerData={saleBannerData}>
			<div className="flex flex-1 items-start">
				<MobileListResourceNavigation />
				<div className="w-full min-w-0">
					{hasVideo && <PlayerContainer post={post} />}
					<div className={cn('relative w-full', {})}>
						{/* <div className="relative z-10 mx-auto flex w-full items-center justify-between">
					{!list ? (
						<Link
							href="/browse"
							className="text-foreground/75 hover:text-foreground mb-3 inline-flex text-sm transition duration-300 ease-in-out"
						>
							← All Posts
						</Link>
					) : (
						<div />
					)}
				</div> */}
						<div className={cn('container relative z-10 py-6 sm:py-8', {})}>
							{/* <Reveal delay={0.3}>
								<Link
									href="/"
									className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider"
								>
									<span>❮</span>
									<span>All Posts</span>
								</Link>
							</Reveal> */}
							<article className="relative mx-auto flex h-full w-full max-w-4xl flex-col">
								<div className="mx-auto flex w-full flex-col gap-5">
									<div className="relative flex w-full flex-col items-center justify-center pb-24 pt-16">
										<Reveal>
											<PostTitle post={post} hasVideo={hasVideo} />
										</Reveal>
										<Reveal delay={0.1} className="pt-12">
											<div className="relative flex w-full items-center justify-center gap-3">
												<div className="flex items-center gap-8">
													<Contributor className="flex [&_img]:size-7 sm:[&_img]:size-auto" />
													<CopyAsMarkdown
														text={`# ${post.fields?.title}\n\n${post.fields?.body}`}
													/>
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
										</Reveal>
										<AsciiField opacity={80} />
									</div>
								</div>
								{post?.type === 'post' && post?.fields?.body && (
									<PostToC markdown={post?.fields?.body} />
								)}
								<Reveal delay={0.2}>
									<PostBody post={post} />
								</Reveal>
								{/* {listSlugFromParam && (
									<PostProgressToggle
										className="flex w-full items-center justify-center"
										postId={post.id}
									/>
								)} */}

								{/* <PostNewsletterCta
							className="flex pt-10 md:hidden"
							trackProps={{
								event: 'subscribed',
								params: {
									location: 'post-below-body',
									post: post.fields.slug,
								},
							}}
						/> */}
							</article>
						</div>
						{!hasVideo && (
							<div className="w-full">
								<div className="container -mt-16 flex flex-col items-center gap-3 pb-10 text-center sm:pb-16">
									{/* <AsciiHeart /> */}
									<TerminalIllustration className="sm:scale-80 mb-4 origin-bottom scale-75 sm:mb-6" />
									<h2 className="mt-3 max-w-sm text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
										Join the Terminal UI Revolution
									</h2>
									<h3 className="text-balance text-lg font-normal tracking-tight opacity-75">
										Get the latest news and updates delivered straight to your
										inbox.
									</h3>
									<div className="mt-4 w-full max-w-xl">
										<LandingSubscribeForm />
									</div>
									<small className="mt-2 font-mono text-xs opacity-50">
										No spam. Unsubscribe anytime.
									</small>
								</div>
							</div>
						)}
						<div className="">
							<div className="container mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 pb-16">
								<p className="font-mono text-xs opacity-50">Share</p>
								<Share.Root
									className="flex flex-row flex-wrap gap-1 sm:items-center"
									title={post.fields.title}
								>
									{/* <Image
										src={`${env.NEXT_PUBLIC_URL}/api/og?resource=${encodeURIComponent(post.fields.slug)}`}
										width={1200 / 4}
										height={630 / 4}
										alt="Share on Bluesky"
										className="rounded-md"
									/> */}

									<Share.Bluesky className="[&_span]:hidden sm:[&_span]:inline-block">
										Share on Bluesky
									</Share.Bluesky>
									<Share.X className="[&_span]:hidden sm:[&_span]:inline-block">
										Tweet
									</Share.X>
									<Share.LinkedIn className="[&_span]:hidden sm:[&_span]:inline-block">
										Share on LinkedIn
									</Share.LinkedIn>
									<Share.CopyUrl />
								</Share.Root>
							</div>
						</div>
						<div className="" data-theme="yellow">
							<PostNextUpFromListPagination
								className="container mx-auto rounded-none py-10 lg:py-16"
								postId={post.id}
								documentIdsToSkip={list?.resources.map(
									(resource) => resource.resource.id,
								)}
							/>
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
				</div>
			</div>
		</LayoutClient>
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
		<article className="prose dark:prose-invert dark:prose-a:text-primary prose-a:text-primary-dark sm:prose-lg lg:prose-lg mx-auto max-w-2xl">
			{content}
		</article>
	)
}

async function PostTitle({
	post,
	hasVideo,
}: {
	post: Post | null
	hasVideo: boolean
}) {
	return (
		<h1
			className={cn(
				'text-center font-sans text-4xl font-semibold tracking-tight sm:text-5xl',
				{},
			)}
		>
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
				fallback={<PlayerContainerSkeleton className="w-full bg-black" />}
			>
				<section
					aria-label="video"
					className="flex flex-col items-center justify-center bg-black"
				>
					<PostPlayer
						postSlug={post.fields?.slug}
						title={post.fields?.title}
						thumbnailTime={post.fields?.thumbnailTime || 0}
						postId={post.id}
						autoPlay={true}
						className=""
						videoResource={videoResource}
					/>
					<PostVideoSubscribeBar />
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

function PostVideoSubscribeBar() {
	return <PostNewsletterCta className="hidden md:flex" />
}

async function PostActionBar({ post }: { post: Post | null }) {
	const { session, ability } = await getServerAuthSession()

	return (
		<>
			{post && ability.can('update', 'Content') ? (
				<Button asChild variant="outline">
					<Link href={`/posts/${post.fields?.slug || post.id}/edit`}>
						<PencilIcon className="size-3 opacity-75" />
						Edit
					</Link>
				</Button>
			) : null}
		</>
	)
}
