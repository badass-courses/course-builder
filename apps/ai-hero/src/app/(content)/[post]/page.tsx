import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import Scrollycoding from '@/components/codehike/scrollycoding'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { Share } from '@/components/share'
import { courseBuilderAdapter } from '@/db'
import { type Post } from '@/lib/posts'
import { getAllPosts, getPost } from '@/lib/posts-query'
import { getPricingProps } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { generateGridPattern } from '@/utils/generate-grid-pattern'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { highlight, Pre, RawCode } from 'codehike/code'
import { recmaCodeHike, remarkCodeHike } from 'codehike/mdx'
import { compileMDX, MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'

import { Button } from '@coursebuilder/ui'

import { PostPlayer } from '../posts/_components/post-player'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'

type Props = {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
	const post = await getPost(params.post)

	if (!post) {
		return parent as Metadata
	}

	return {
		title: post.fields.title,
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
		<article className="prose sm:prose-lg lg:prose-xl prose-p:text-foreground/80 mt-10 max-w-none">
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
		<main>
			{hasVideo && <PlayerContainer post={post} />}
			<div
				className={cn('container relative max-w-screen-xl pb-24', {
					'pt-16': !hasVideo,
				})}
			>
				<div
					className={cn('absolute right-0 w-full', {
						'-top-10': hasVideo,
						'top-0': !hasVideo,
					})}
				>
					<img
						src={squareGridPattern}
						className="h-[400px] w-full overflow-hidden object-cover object-right-top opacity-[0.15] saturate-0"
					/>
					<div
						className="to-background via-background absolute left-0 top-0 z-10 h-full w-full bg-gradient-to-bl from-transparent"
						aria-hidden="true"
					/>
				</div>
				{/* <div className="absolute left-0 top-0 -z-10 h-[76px] w-full">
          <img
            src={squareGridPattern}
            className="absolute left-0 top-0 h-[76px] w-full overflow-hidden object-cover object-top"
          />
          <div className="from-background via-background/80 to-background absolute left-0 top-0 z-10 h-full w-full bg-gradient-to-r" />
        </div> */}
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
						<Contributor className="flex md:hidden [&_img]:w-8" />
						<Post post={post} />

						{/* <aside className="relative col-span-3 col-start-10 flex h-full flex-col pt-24">
							<div className="top-20 md:sticky">
								<Contributor className="hidden md:flex" />
								<div className="mt-5 flex w-full flex-col gap-1">
									<strong className="text-lg font-semibold">Share</strong>
									<Share
										className="bg-background w-full"
										title={post?.fields.title}
									/>
								</div>
							</div>
						</aside> */}
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

async function PlayerContainer({ post }: { post: Post | null }) {
	const displayOverlay = false

	if (!post) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id

	const videoResource = await courseBuilderAdapter.getVideoResource(resource)
	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	return videoResource ? (
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
					className="aspect-video h-full max-h-[75vh] w-full overflow-hidden"
					videoResource={videoResource}
				/>
				{!ckSubscriber && <PostNewsletterCta />}
			</section>
		</Suspense>
	) : resource ? null : null // spacer // <div className="pt-16" />
}

export async function Code({ codeblock }: { codeblock: RawCode }) {
	const highlighted = await highlight(codeblock, 'github-dark')
	return (
		<Pre
			code={highlighted}
			className="bg-background text-xs sm:text-sm"
			style={{ ...highlighted.style, padding: '1rem', borderRadius: '0.5rem' }}
			// handlers={[callout]}
		/>
	)
}
