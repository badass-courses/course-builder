import * as React from 'react'
import { Suspense, use } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SharePostModal from '@/app/_components/share-post-modal'
import { CopyEggheadLinkButton } from '@/app/(content)/[post]/copy-link-button'
import { TranscriptContainer } from '@/app/(content)/[post]/transcript'
import { PostPlayer } from '@/app/(content)/posts/_components/post-player'
import { courseBuilderAdapter } from '@/db'
import { Post } from '@/lib/posts'
import { getCachedPost, getPost } from '@/lib/posts-query'
import { getTranscript } from '@/lib/transcript-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResourceAPI } from '@/utils/get-og-image-url-for-resource'
import { subject } from '@casl/ability'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

type Props = {
	params: Promise<{ post: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

	const ogImageUrl =
		post.fields?.ogImage ||
		getOGImageUrlForResourceAPI({
			id: post.id,
			fields: { slug: post.fields?.slug || post.id },
			updatedAt: post.updatedAt,
		})

	return {
		title: post.fields?.title,
		openGraph: {
			images: [
				{
					url: ogImageUrl,
				},
			],
		},
	}
}

export default async function PostPage(props: Props) {
	const params = await props.params
	const postLoader = getPost(params.post)
	return (
		<div>
			<main className="mx-auto w-full" id="post">
				<Suspense
					fallback={
						<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
					}
				>
					<PostActionBar postLoader={postLoader} />
				</Suspense>
				<PlayerContainer postLoader={postLoader} />
				<article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
					<div className="max-w-(--breakpoint-lg) mx-auto w-full pb-5 lg:px-5">
						<div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
							<div className="flex flex-col lg:col-span-8">
								<PostBody postLoader={postLoader} />
							</div>
						</div>
					</div>
				</article>
			</main>
		</div>
	)
}

async function PostActionBar({
	postLoader,
}: {
	postLoader: Promise<Post | null>
}) {
	const { ability } = await getServerAuthSession()
	const post = await postLoader

	return (
		<>
			{post && ability.can('update', subject('Content', post)) ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<Button size="sm" asChild>
						<Link href={`/posts/${post.fields.slug || post.id}/edit`}>
							Edit
						</Link>
					</Button>
					<CopyEggheadLinkButton slug={post.fields.slug} />
				</div>
			) : (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
			)}
		</>
	)
}

function PlayerContainerSkeleton() {
	return (
		<div className="relative z-10 flex items-center justify-center">
			<div className="max-w-(--breakpoint-lg) flex w-full flex-col">
				<div className="relative aspect-video">
					<div className="flex items-center justify-center overflow-hidden">
						<div className="h-full w-full bg-gray-100" />
					</div>
				</div>
			</div>
		</div>
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

	return videoResource ? (
		<Suspense fallback={<PlayerContainerSkeleton />}>
			<div className="relative z-10 flex items-center justify-center">
				<div className="max-w-(--breakpoint-lg) flex w-full flex-col">
					<div className="relative aspect-video">
						<div
							className={cn(
								'flex items-center justify-center overflow-hidden',
								{
									hidden: displayOverlay,
								},
							)}
						>
							<PostPlayer videoResource={videoResource} />
						</div>
					</div>
				</div>
			</div>
		</Suspense>
	) : null
}

async function PostBody({ postLoader }: { postLoader: Promise<Post | null> }) {
	const post = await postLoader

	if (!post) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id
	const transcriptLoader = getTranscript(resource)

	return (
		<>
			<h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
				{post.fields.title}
			</h1>
			<SharePostModal post={post} />
			<div className="flex w-full justify-start gap-2">
				<Link
					href={`https://egghead.io/${post.fields.slug}`}
					className="text-muted-foreground mb-5 text-sm underline underline-offset-2 hover:underline"
					target="_blank"
				>
					Open on egghead
				</Link>
			</div>

			{post.fields.body && (
				<>
					<ReactMarkdown className="prose dark:prose-invert">
						{post.fields.body}
					</ReactMarkdown>
				</>
			)}
			<Suspense>
				<TranscriptContainer transcriptLoader={transcriptLoader} />
			</Suspense>
		</>
	)
}
