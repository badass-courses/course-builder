import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import Spinner from '@/components/spinner'
import { TipNewsletterCta } from '@/components/tip-newsletter-cta'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import {
	getLessonMuxPlaybackId,
	getLessonVideoTranscript,
} from '@/lib/lessons-query'
import { type Tip } from '@/lib/tips'
import { getTip } from '@/lib/tips-query'
import { getTranscript } from '@/lib/transcript-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { VideoObject } from 'schema-dts'

import { Button, Skeleton } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import { AuthedVideoPlayer } from '../../_components/authed-video-player'
import VideoPlayerOverlay from '../../_components/video-player-overlay'
import { Transcript } from '../../_components/video-transcript-renderer'

type Props = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const tip = await getTip(params.slug)

	if (!tip) {
		return parent as Metadata
	}

	return {
		title: tip.fields?.title,
		description: tip.fields?.description,
		openGraph: { images: [getOGImageUrlForResource(tip)] },
	}
}

export default async function TipPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const tipLoader = getTip(params.slug)
	const cookieStore = await cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	const transcriptLoader = getLessonVideoTranscript(params.slug)

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
				<Suspense>
					<VideoObjectMetadata tipLoader={tipLoader} />
				</Suspense>
				<main className="container px-0">
					<PlayerContainer tipLoader={tipLoader} />
				</main>
				{!ckSubscriber && (
					<TipNewsletterCta
						trackProps={{
							event: 'subscribed',
							params: {
								source: 'tip',
								slug: params.slug,
							},
						}}
					/>
				)}
				<div className="container flex flex-col-reverse border-t px-0 lg:flex-row lg:border-x">
					<div className="flex flex-col py-8">
						<TipBody tipLoader={tipLoader} />
						<div className="mt-10 border-t px-5 pt-8 sm:px-8">
							<h3 className="font-heading mb-8 text-2xl font-bold leading-none ">
								Transcript
							</h3>
							<Transcript transcriptLoader={transcriptLoader} />
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

	const playbackIdLoader = getLessonMuxPlaybackId(tip.id)

	return (
		<VideoPlayerOverlayProvider>
			<div className="relative flex aspect-video h-auto w-full items-center justify-center">
				<Suspense fallback={<PlayerContainerSkeleton />}>
					<AuthedVideoPlayer
						className="overflow-hidden border-x"
						playbackIdLoader={playbackIdLoader}
						resource={tip}
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
			<h1 className="font-heading fluid-2xl w-full px-5 pb-5 font-semibold sm:px-8">
				{tip.fields?.title}
			</h1>
			<div className="px-5 sm:px-8">
				<Contributor />
			</div>
			{tip.fields?.body && (
				<div className="prose mt-5 max-w-none border-t px-5 pt-8 sm:px-8">
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

const VideoObjectMetadata = async ({
	tipLoader,
}: {
	tipLoader: Promise<Tip | null>
}) => {
	const tip = await tipLoader
	if (!tip) {
		return null
	}

	const resource = tip?.resources?.[0]?.resource.id
	const videoResource = await courseBuilderAdapter.getVideoResource(resource)

	const jsonLd: VideoObject = {
		'@type': 'VideoObject',
		name: tip?.fields.title,
		creator: {
			'@type': 'Person',
			name: config.author,
		},
		description: tip?.fields.description,
		duration: videoResource?.duration as any,
		uploadDate: tip?.createdAt as any,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
