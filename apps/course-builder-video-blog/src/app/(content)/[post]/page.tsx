import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostPlayer } from '@/app/(content)/posts/_components/post-player'
import { courseBuilderAdapter } from '@/db'
import { Post } from '@/lib/posts'
import { getPost } from '@/lib/posts-query'
import { getTranscript } from '@/lib/transcript-query'
import { getServerAuthSession } from '@/server/auth'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

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
		title: post.fields?.title,
	}
}

export default async function PostPage({ params }: Props) {
	headers()

	console.log(params)
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
					<div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">
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
			{post && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button size="sm" asChild>
						<Link href={`/posts/${post.fields.slug || post.id}/edit`}>
							Edit
						</Link>
					</Button>
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
			<div className="flex w-full max-w-screen-lg flex-col">
				<div className="relative aspect-[16/9]">
					<div className="flex items-center justify-center  overflow-hidden">
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

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
		<Suspense fallback={<PlayerContainerSkeleton />}>
			<div className="relative z-10 flex items-center justify-center">
				<div className="flex w-full max-w-screen-lg flex-col">
					<div className="relative aspect-[16/9]">
						<div
							className={cn(
								'flex items-center justify-center  overflow-hidden',
								{
									hidden: displayOverlay,
								},
							)}
						>
							<PostPlayer videoResourceLoader={videoResourceLoader} />
						</div>
					</div>
				</div>
			</div>
		</Suspense>
	)
}

async function PostBody({ postLoader }: { postLoader: Promise<Post | null> }) {
	const post = await postLoader

	if (!post) {
		notFound()
	}

	const resource = post.resources?.[0]?.resource.id

	const transcript = await getTranscript(resource)

	return (
		<>
			<h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
				{post.fields.title}
			</h1>

			{post.fields.body && (
				<>
					<ReactMarkdown className="prose dark:prose-invert">
						{post.fields.body}
					</ReactMarkdown>
				</>
			)}
			{transcript && (
				<div className="w-full max-w-2xl pt-5">
					<h3 className="font-bold">Transcript</h3>
					<ReactMarkdown className="prose dark:prose-invert">
						{transcript}
					</ReactMarkdown>
				</div>
			)}
		</>
	)
}
