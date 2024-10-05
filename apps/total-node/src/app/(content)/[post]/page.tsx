import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { PricingWidget } from '@/app/_components/home-pricing-widget'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter } from '@/db'
import { type Post } from '@/lib/posts'
import { getPost } from '@/lib/posts-query'
import { getPricingProps } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { Button } from '@coursebuilder/ui'

import { PostPlayer } from '../posts/_components/post-player'
import { PostNewsletterCta } from '../posts/_components/post-video-subscribe-form'

type Props = {
	params: { post: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
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

async function PostActionBar({
	postLoader,
}: {
	postLoader: Promise<Post | null>
}) {
	const { session, ability } = await getServerAuthSession()
	const post = await postLoader

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

async function Post({ postLoader }: { postLoader: Promise<Post | null> }) {
	const post = await postLoader

	if (!post) {
		notFound()
	}

	return (
		<article className="prose sm:prose-lg lg:prose-xl prose-p:text-foreground/80 mt-10 max-w-none">
			{post.fields.body && (
				<MDXRemote
					source={post.fields.body}
					components={{
						pre: async (props: any) => {
							const children = props?.children.props.children
							const language =
								props?.children.props.className?.split('-')[1] || 'typescript'
							try {
								const html = await codeToHtml({ code: children, language })
								return <div dangerouslySetInnerHTML={{ __html: html }} />
							} catch (error) {
								console.error(error)
								return <pre {...props} />
							}
						},
					}}
				/>
			)}
		</article>
	)
}

async function PostTitle({ postLoader }: { postLoader: Promise<Post | null> }) {
	const post = await postLoader

	return (
		<h1 className="fluid-3xl mb-4 inline-flex font-bold">
			{post?.fields?.title}
		</h1>
	)
}

export default async function PostPage({
	params,
	searchParams,
}: {
	params: { post: string }
	searchParams: { [key: string]: string | undefined }
}) {
	const postLoader = getPost(params.post)
	const cookieStore = cookies()
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

	return (
		<main>
			<PlayerContainer postLoader={postLoader} />
			<div className="container max-w-screen-xl pb-24">
				<div className="flex w-full items-center justify-between">
					<Link
						href="/posts"
						className="text-foreground/75 hover:text-foreground mb-3 inline-flex text-sm transition duration-300 ease-in-out"
					>
						← Posts
					</Link>
					<Suspense fallback={null}>
						<PostActionBar postLoader={postLoader} />
					</Suspense>
				</div>
				<div>
					<article className="flex h-full grid-cols-12 flex-col gap-5 md:grid">
						<div className="col-span-8">
							<PostTitle postLoader={postLoader} />
							<Contributor className="flex md:hidden [&_img]:w-8" />
							<Post postLoader={postLoader} />
						</div>
						<aside className="relative col-span-2 col-start-10 flex h-full flex-col pt-24">
							<Contributor className="hidden md:flex" />
						</aside>
					</article>
				</div>
			</div>
			{ckSubscriber && product && allowPurchase && pricingDataLoader ? (
				<section id="buy">
					<h2 className="fluid-2xl mb-10 text-balance px-5 text-center font-bold">
						Get Really Good At Next.js
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
			) : (
				<PrimaryNewsletterCta className="pb-20" />
			)}
		</main>
	)
}

async function PlayerContainer({
	postLoader,
}: {
	postLoader: Promise<Post | null>
}) {
	const post = await postLoader
	const displayOverlay = false

	if (!post) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id

	const videoResource = await courseBuilderAdapter.getVideoResource(resource)
	const cookieStore = cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	return videoResource ? (
		<Suspense fallback={<PlayerContainerSkeleton />}>
			<section
				aria-label="video"
				className="mb-10 flex flex-col items-center justify-center border-b bg-black"
			>
				<PostPlayer
					className="h-full max-h-[75vh] w-full overflow-hidden"
					videoResource={videoResource}
				/>
				{!ckSubscriber && <PostNewsletterCta />}
			</section>
		</Suspense>
	) : (
		// spacer
		<div className="pt-16" />
	)
}
