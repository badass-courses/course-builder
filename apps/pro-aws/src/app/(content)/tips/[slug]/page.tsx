import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import { type Tip } from '@/lib/tips'
import { getTip } from '@/lib/tips-query'
import { getTranscript } from '@/lib/transcript-query'
import { getServerAuthSession } from '@/server/auth'
import { codeToHtml } from '@/utils/shiki'
import { MDXRemote } from 'next-mdx-remote/rsc'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import { AuthedVideoPlayer } from '../../_components/authed-video-player'
import VideoPlayerOverlay from '../../_components/video-player-overlay'
import { Transcript } from '../../_components/video-transcript-renderer'

type Props = {
	params: { slug: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const tip = await getTip(params.slug)

	if (!tip) {
		return parent as Metadata
	}

	return {
		title: tip.fields?.title,
	}
}

export default async function TipPage({
	params,
}: {
	params: { slug: string }
}) {
	headers()
	const tipLoader = getTip(params.slug)

	return (
		<div>
			<div className="mx-auto w-full" id="tip">
				<Suspense
					fallback={
						<div className="bg-background container flex h-9 w-full items-center justify-between" />
					}
				>
					<TipActionBar tipLoader={tipLoader} />
				</Suspense>
				<main className="container px-0">
					<PlayerContainer tipLoader={tipLoader} />
				</main>
				<div className="container flex flex-col-reverse border-t px-0 lg:flex-row lg:border-x">
					<div className="flex flex-col py-8">
						<Suspense fallback={<div>Loading...</div>}>
							<TipBody tipLoader={tipLoader} />
						</Suspense>
						<div className="mt-10 border-t px-5 pt-8 sm:px-8">
							<h3 className="font-heading mb-8 text-2xl font-bold leading-none text-white">
								Transcript
							</h3>
							<Suspense fallback={<div>Loading...</div>}>
								<Transcript resourceLoader={tipLoader} />
							</Suspense>
						</div>
					</div>
					{/* <div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">
						<div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
							<div className="flex flex-col lg:col-span-8">
								<TipBody tipLoader={tipLoader} />
							</div>
						</div>
					</div> */}
				</div>
			</div>
		</div>
	)
}

async function TipActionBar({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const { ability } = await getServerAuthSession()
	const tip = await tipLoader

	return (
		<>
			{tip && ability.can('update', 'Content') ? (
				<div className="container flex h-9 w-full items-center justify-between border-x px-1">
					<div />
					<Button size="sm" asChild>
						<Link href={`/tips/${tip.fields.slug || tip.id}/edit`}>Edit</Link>
					</Button>
				</div>
			) : null}
		</>
	)
}

function PlayerContainerSkeleton() {
	return (
		<div className="flex aspect-video h-auto w-full items-center justify-center border-x">
			<Spinner />
		</div>
	)
}

async function PlayerContainer({
	tipLoader,
}: {
	tipLoader: Promise<Tip | null>
}) {
	const tip = await tipLoader

	if (!tip) {
		notFound()
	}

	const resource = tip.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
		<VideoPlayerOverlayProvider>
			<div className="relative flex aspect-video h-auto w-full items-center justify-center">
				{/* <VideoPlayerOverlay /> */}
				<Suspense fallback={<PlayerContainerSkeleton />}>
					<AuthedVideoPlayer
						className="overflow-hidden border-x"
						videoResourceLoader={videoResourceLoader}
					/>
				</Suspense>
			</div>
		</VideoPlayerOverlayProvider>
	)
}
async function TipBody({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const tip = await tipLoader

	if (!tip) {
		notFound()
	}

	const resource = tip.resources?.[0]?.resource.id

	const transcript = await getTranscript(resource)

	return (
		<article>
			<h1 className="font-heading w-full text-balance px-5 pb-5 text-3xl font-bold text-white sm:px-8 sm:text-4xl lg:text-5xl">
				{tip.fields?.title}
			</h1>
			<div className="px-5 sm:px-8">
				<Contributor />
			</div>
			{tip.fields?.body && (
				<div className="prose dark:prose-invert mt-5 max-w-none border-t px-5 pt-8 sm:px-8">
					<MDXRemote
						source={tip.fields.body}
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
				</div>
			)}
		</article>
	)
}
