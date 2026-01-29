import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Noise from '@/components/brand/noise'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
// import { PricingWidget } from '@/components/home-pricing-widget'
// import { getPricingProps } from '@/lib/pricing-query'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import SplitText from '@/components/split-text'
import SubscribeFormWithStatus from '@/components/subscribe-form-with-status'
import TickerScroll from '@/components/ticker-scroll'
import { courseBuilderAdapter } from '@/db'
import type { List } from '@/lib/lists'
import { getAllLists, getCachedListForPost } from '@/lib/lists-query'
import { type Post } from '@/lib/posts'
import { getAllPosts, getCachedPostOrList } from '@/lib/posts-query'
import { getSaleBannerDataFromSearchParams } from '@/lib/sale-banner'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { ArrowLeftIcon, Github, PencilIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { ContentResourceResource } from '@coursebuilder/core/schemas'
import {
	Button,
	CopyAsMarkdown,
	OpenIn,
	OpenInContent,
	OpenInTrigger,
} from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import ModuleResourceList from '../_components/navigation/module-resource-list'
import PostNextUpFromListPagination from '../_components/post-next-up-from-list-pagination'
import ListPage from '../lists/[slug]/_page'
import { PostPlayer } from '../posts/_components/post-player'
import PostToC from '../posts/_components/post-toc'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'
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
	const markdownToCopy = `# ${post?.fields?.title}

	${post?.fields?.body}`

	return (
		<LayoutClient withContainer={false} saleBannerData={saleBannerData}>
			<nav className="absolute left-5 top-5 z-50 flex h-[var(--nav-height)] items-stretch text-sm">
				<Link href="/#posts" className="flex items-center gap-1">
					<ArrowLeftIcon className="inline-block size-4" />
					All posts{' '}
				</Link>
			</nav>
			<Noise />
			<div className="flex flex-1 items-start">
				{/* <MobileListResourceNavigation /> */}
				<div className="w-full min-w-0">
					{hasVideo && <PlayerContainer post={post} />}
					<div>
						<article className="mx-auto flex w-full flex-col gap-5 px-[12vw] py-[17dvh] sm:px-[15vw]">
							<PostTitle post={post} hasVideo={hasVideo} />
							<div className="relative mb-3 flex w-full items-center justify-between gap-3">
								<div className="flex items-center gap-1">
									<Contributor className="mr-4 flex [&_img]:size-7 sm:[&_img]:size-auto" />
									<OpenIn query={markdownToCopy}>
										<OpenInTrigger
											label="Use with AI"
											className="rounded-full"
										/>
										<OpenInContent className="w-auto rounded-full">
											<CopyAsMarkdown className="h-7 rounded-full" />
										</OpenInContent>
									</OpenIn>
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
									<Suspense fallback={null}>
										<PostActionBar post={post} />
									</Suspense>
								</div>
							</div>

							{/* {post?.type === 'post' && post?.fields?.body && (
								<PostToC markdown={post?.fields?.body} />
							)} */}
							<PostBody post={post} />
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
							<SubscribeFormWithStatus
								className="mt-16 flex max-w-2xl flex-col items-start gap-2 font-serif text-xl font-semibold sm:flex-row sm:items-end"
								trackProps={{
									event: 'subscribed',
									params: {
										post: post.fields.slug,
										location: 'post',
									},
								}}
							/>
						</article>

						<div className="border-t">
							<div className="px-0! container mx-auto flex w-full flex-col items-center justify-center gap-5 border-x pt-5 sm:flex-row sm:pt-0">
								<strong className="text-base font-medium tracking-tight sm:text-lg">
									Share
								</strong>
								<Share
									className="w-full border-t font-serif sm:w-auto sm:border-t-0"
									title={post?.fields.title}
								/>
							</div>
						</div>
						<div className="border-t" data-theme="blue">
							<PostNextUpFromListPagination
								className="container mx-auto rounded-none border-x py-10 lg:py-16"
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
		<div className="">
			<article className="prose prose-themed prose-code:text-sm dark:prose-invert prose-lg mr-auto w-full max-w-2xl pt-5 lg:text-xl">
				{content}
			</article>
		</div>
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
		<SplitText
			as="h1"
			className={cn(
				'font-heading mb-4 text-5xl tracking-tight sm:text-5xl lg:text-6xl dark:text-white',
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
		</SplitText>
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
					className="flex flex-col items-center justify-center border-b bg-black"
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
					<PostNewsletterCta
						className="hidden md:flex"
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
				<Button
					asChild
					variant="outline"
					className="flex items-center gap-2 rounded-full"
				>
					<Link href={`/posts/${post.fields?.slug || post.id}/edit`}>
						<PencilIcon className="size-3" /> Edit
					</Link>
				</Button>
			) : null}
		</>
	)
}
