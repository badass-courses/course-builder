import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { cookies, headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SubscribeForm } from '@/app/(content)/tips/_components/tip-subscribe-form'
import FloatingActionsBar from '@/components/floating-actions-bar'
import { Icon } from '@/components/icons'
import ResourceContributor from '@/components/resource-contributor'
import { courseBuilderAdapter } from '@/db'
import { type Tip } from '@/lib/tips'
import { getTip, getTipsModule } from '@/lib/tips-query'
import { getTranscript } from '@/lib/transcript-query'
import { getServerAuthSession } from '@/server/auth'
import { codeToHtml } from '@/utils/shiki'
import slugify from '@sindresorhus/slugify'
import { CheckIcon } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import { AuthedVideoPlayer } from '../../_components/authed-video-player'
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
	}
}

export default async function TipPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	console.log('🤡', (await cookies()).get('ck_subscriber_id'))
	const tipLoader = getTip(params.slug)

	return (
		<>
			<Suspense fallback={<div />}>
				<TipActionBar tipLoader={tipLoader} />
			</Suspense>
			<main className="mx-auto w-full" id="tip">
				<div className="relative z-10 flex items-center justify-center">
					<div className="flex w-full max-w-screen-lg flex-col">
						<PlayerContainer tipLoader={tipLoader} />
						<Suspense
							fallback={
								<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
							}
						>
							<SubscribeForm tipLoader={tipLoader} />
						</Suspense>
					</div>
				</div>
				<article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
					<div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">
						<div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
							<div className="flex flex-col lg:col-span-8">
								<TipTitle tipLoader={tipLoader} />
								<TipAuthor
									tipLoader={tipLoader}
									className="inline-flex py-2 text-base font-semibold text-gray-700 lg:hidden dark:text-gray-300 [&_span]:font-bold"
								/>
								<TipBody tipLoader={tipLoader} />
								<TipTranscript tipLoader={tipLoader} />
							</div>
							<div className="col-span-3">
								<TipAuthor
									tipLoader={tipLoader}
									className="mx-0 hidden py-2 text-base font-semibold text-gray-700 lg:flex dark:text-gray-300 [&_span]:font-bold"
								/>
								<Suspense
									fallback={
										<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
									}
								>
									<RelatedTips currentTip={params.slug} />
								</Suspense>
							</div>
						</div>
					</div>
				</article>
			</main>
		</>
	)
}

async function TipTranscript({
	tipLoader,
}: {
	tipLoader: Promise<Tip | null>
}) {
	const tip = await tipLoader
	if (!tip) return null
	const resource = tip?.resources?.[0]?.resource.id
	const transcript = await getTranscript(resource)
	return transcript ? (
		<div className="w-full max-w-2xl pt-5">
			<Transcript resourceLoader={tipLoader} />
		</div>
	) : null
}

async function TipBody({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const tip = await tipLoader

	if (!tip) {
		notFound()
	}

	return tip.fields.body ? (
		<div className="prose dark:prose-invert lg:prose-lg w-full max-w-none pb-5 pt-5">
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
	) : null
}

async function TipAuthor({
	tipLoader,
	className,
}: {
	tipLoader: Promise<Tip | null>
	className?: string
}) {
	const tip = await tipLoader

	if (!tip) return null

	const author = tip.contributions.find(
		(c) => c.contributionType.slug === 'author',
	)?.user
	return (
		<ResourceContributor
			name={author?.name || 'unknown'}
			slug={slugify(author?.name || 'unknown')}
			image={author?.image}
			className={className}
		/>
	)
}

async function TipTitle({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const tip = await tipLoader
	if (!tip) return null
	const resourceCompleted = false
	return (
		<h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
			{tip.fields.title}
			{resourceCompleted && (
				<>
					<span className="sr-only">(watched)</span>
					<CheckIcon
						aria-hidden="true"
						className="absolute -left-4 top-2 w-4 opacity-50 lg:-left-8 lg:w-6"
					/>
				</>
			)}
		</h1>
	)
}

async function TipActionBar({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const { ability } = await getServerAuthSession()
	const tip = await tipLoader

	return (
		<>
			{tip && ability.can('update', 'Content') ? (
				<FloatingActionsBar>
					<Button size="sm" asChild>
						<Link href={`/tips/${tip.fields.slug || tip.id}/edit`}>Edit</Link>
					</Button>
				</FloatingActionsBar>
			) : null}
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
	tipLoader,
}: {
	tipLoader: Promise<Tip | null>
}) {
	const tip = await tipLoader
	const displayOverlay = false

	if (!tip) {
		notFound()
	}

	const resource = tip.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
		<VideoPlayerOverlayProvider>
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
								<AuthedVideoPlayer videoResourceLoader={videoResourceLoader} />
							</div>
						</div>
					</div>
				</div>
			</Suspense>
		</VideoPlayerOverlayProvider>
	)
}

async function RelatedTips({ currentTip }: { currentTip: string }) {
	const tipsModule = await getTipsModule()
	const tipsToWatch = tipsModule
		.filter((tip) => tip.fields.slug !== currentTip)
		.slice(0, 6)
	return (
		<section className="mx-auto mt-8 h-full w-full border-t pt-8 md:pl-3">
			<Link href="/tips" className="font-heading pt-2 text-2xl font-black">
				More Tips
			</Link>
			<ul className="flex flex-col pt-4">
				{tipsToWatch.map((tip) => {
					// TODO implement resourceCompleted check
					const resourceCompleted = false
					const muxPlaybackId =
						tip?.resources?.[0]?.resource?.fields?.muxPlaybackId
					const thumbnail =
						`https://image.mux.com/${muxPlaybackId}/thumbnail.png?width=720&height=405&fit_mode=preserve` ||
						'https://res.cloudinary.com/badass-courses/image/upload/v1700690096/course-builder-og-image-template_qfarun.png'
					return (
						<li key={tip.id} className="flex w-full flex-col pb-5">
							<Link
								href={{
									pathname: `/tips/${tip.fields.slug}`,
								}}
								className="group"
							>
								<div className="relative flex items-center justify-center overflow-hidden rounded border">
									<span className="sr-only">
										Play {tip.fields.title}{' '}
										{resourceCompleted && (
											<span className="sr-only">(completed)</span>
										)}
									</span>
									<div className="flex w-full items-center justify-center">
										<Image
											src={thumbnail}
											alt=""
											width={480}
											height={270}
											aria-hidden="true"
											className="brightness-90 transition duration-300 ease-in-out group-hover:brightness-100 dark:brightness-75 "
										/>
									</div>
									<div
										className="bg-background text-foreground absolute flex scale-50 items-center justify-center rounded-full p-4 opacity-100 transition"
										aria-hidden="true"
									>
										{resourceCompleted ? (
											<>
												<Icon
													name="Checkmark"
													className="absolute h-10 w-10 text-white transition group-hover:opacity-0"
													aria-hidden="true"
												/>
												<Icon
													name="Playmark"
													className="absolute h-8 w-8 text-white opacity-0 transition group-hover:opacity-100"
												/>
											</>
										) : (
											<Icon
												name="Playmark"
												className="relative h-6 w-6 translate-x-0.5"
											/>
										)}
									</div>
								</div>
								<h3 className="w-full pt-1 font-semibold leading-tight">
									<div className="text-balance">{tip.fields.title}</div>
									{resourceCompleted && (
										<span className="sr-only">(watched)</span>
									)}
								</h3>
							</Link>
						</li>
					)
				})}
			</ul>
		</section>
	)
}
