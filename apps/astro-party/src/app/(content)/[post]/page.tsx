import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { Layout } from '@/components/layout'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import { courseBuilderAdapter } from '@/db'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { serialize } from 'next-mdx-remote/serialize'
import rehypeExpressiveCode from 'rehype-expressive-code'

import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import { AuthedVideoPlayer } from '../_components/authed-video-player'
import { MDXBody } from '../_components/mdx-body'

type Props = {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const post = await getArticle(params.post)

	if (!post) {
		return parent as Metadata
	}

	return {
		title: post.fields.title,
		description: post.fields.description,
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

async function PostActionBar({ post }: { post: Article }) {
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

async function Post({ post }: { post: Article }) {
	if (!post?.fields?.body) {
		return null
	}
	const mdxSerialized = await serialize(post.fields.body, {
		blockJS: false,
		mdxOptions: {
			rehypePlugins: [[rehypeExpressiveCode]],
		},
	})

	return (
		<article className="prose sm:prose-lg mt-10 max-w-none">
			<MDXBody source={mdxSerialized} />
		</article>
	)
}

async function PostTitle({ post }: { post: Article }) {
	return (
		<h1 className="fluid-3xl font-heading mb-8 inline-flex w-full text-balance font-bold">
			{post?.fields?.title}
		</h1>
	)
}

async function PostVideo({
	post,
	videoResourceId,
}: {
	videoResourceId?: string
	post: Article
}) {
	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	if (!videoResource?.muxPlaybackId) {
		return null
	}

	return (
		<div className="flex items-center justify-center border-b-2 bg-black">
			<AuthedVideoPlayer
				autoPlay={false}
				className="aspect-video h-full w-full"
				muxPlaybackId={videoResource.muxPlaybackId}
				resource={post}
			/>
		</div>
	)
}

export default async function PostPage(props: {
	params: Promise<{ post: string }>
}) {
	const params = await props.params
	const post = await getArticle(params.post)
	if (!post) {
		notFound()
	}

	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	const videoResourceId = post?.resources?.find((resourceJoin) => {
		return resourceJoin.resource.type === 'videoResource'
	})?.resource.id

	return (
		<Layout>
			{/* <div className="container px-2 sm:px-5"> */}
			<div className="flex w-full flex-col">
				<VideoPlayerOverlayProvider>
					<PostVideo videoResourceId={videoResourceId} post={post} />
				</VideoPlayerOverlayProvider>
				<div
					className={cn('mx-auto w-full pb-24 pt-10', {
						// 'pt-(--nav-height)': !videoResourceId,
						// 'pt-8': videoResourceId,
					})}
				>
					<article className="">
						<div className="flex w-full flex-col items-center justify-center border-b-2 px-5 pb-10">
							<div className="mx-auto w-full max-w-4xl">
								<div className="flex w-full items-center justify-between">
									<Link
										href="/posts"
										className="text-primary font-rounded mb-3 inline-flex text-base font-semibold hover:underline"
									>
										← Posts
									</Link>
									<Suspense fallback={null}>
										<PostActionBar post={post} />
									</Suspense>
								</div>
								<PostTitle post={post} />
								<Contributor />
							</div>
						</div>
						<div className="mx-auto flex w-full max-w-4xl flex-col px-5 py-5">
							<Post post={post} />
						</div>
					</article>
				</div>
				{!ckSubscriber && (
					<section
						aria-label="Newsletter"
						className="jusfify-center bg-brand-green flex w-full items-center border-t-2 px-2 py-5 sm:py-10"
					>
						<PrimaryNewsletterCta className="mx-auto w-full max-w-3xl" />
					</section>
				)}
			</div>
			{/* </div> */}
		</Layout>
	)
}
