import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
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

import { AuthedVideoPlayer } from '../_components/authed-video-player'
import { MDXBody } from '../_components/mdx-body'

type Props = {
	params: { post: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
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
		mdxOptions: {
			rehypePlugins: [[rehypeExpressiveCode]],
		},
	})

	return (
		<article className="prose sm:prose-lg mt-10 max-w-none border-t pt-10">
			<MDXBody source={mdxSerialized} />
		</article>
	)
}

async function PostTitle({ post }: { post: Article }) {
	return (
		<h1 className="fluid-2xl font-rounded mb-4 inline-flex w-full text-balance font-semibold">
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
		return <div aria-hidden="true" className="py-5" />
	}

	return (
		<div className="flex max-h-[calc(100vh-300px)] items-center justify-center bg-black">
			<AuthedVideoPlayer
				autoPlay={false}
				className="aspect-video h-full max-h-[calc(100vh-300px)] w-full"
				muxPlaybackId={videoResource.muxPlaybackId}
				resource={post}
			/>
		</div>
	)
}

export default async function PostPage({
	params,
}: {
	params: { post: string }
}) {
	const post = await getArticle(params.post)
	if (!post) {
		notFound()
	}

	const cookieStore = cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	const videoResourceId = post?.resources?.find((resourceJoin) => {
		return resourceJoin.resource.type === 'videoResource'
	})?.resource.id

	return (
		<main>
			<VideoPlayerOverlayProvider>
				<PostVideo videoResourceId={videoResourceId} post={post} />
			</VideoPlayerOverlayProvider>
			<div className="container max-w-screen-lg pb-24 pt-5">
				<div className="flex w-full items-center justify-between">
					<Link
						href="/posts"
						className="text-primary mb-3 inline-flex text-sm hover:underline"
					>
						← Posts
					</Link>
					<Suspense fallback={null}>
						<PostActionBar post={post} />
					</Suspense>
				</div>
				<article>
					<PostTitle post={post} />
					<Contributor />
					<Post post={post} />
				</article>
			</div>
			{!ckSubscriber && (
				<section
					aria-label="Newsletter"
					className="bg-brand-green jusfify-center flex w-full items-center py-10"
				>
					<PrimaryNewsletterCta className="mx-auto w-full max-w-3xl" />
				</section>
			)}
		</main>
	)
}
