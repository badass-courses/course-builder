import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TipPlayer } from '@/app/(content)/tips/_components/tip-player'
import { SubscribeForm } from '@/app/(content)/tips/_components/tip-subscribe-form'
import FloatingActionsBar from '@/components/floating-actions-bar'
import ResourceContributor from '@/components/resource-contributor'
import { courseBuilderAdapter } from '@/db'
import { type Tip } from '@/lib/tips'
import { getTip } from '@/lib/tips-query'
import { getTranscript } from '@/lib/transcript-query'
import MDX from '@/mdx/mdx'
import serializeMDX from '@/mdx/serialize-mdx'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import slugify from '@sindresorhus/slugify'
import { CheckIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

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
	console.log('🤡', cookies().get('ck_subscriber_id'))
	const tipLoader = getTip(params.slug)
	console.log(tipLoader)

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
								{/*<RelatedTips currentTip={tip} tips={tips}/>*/}
								{/* {tweet && <ReplyOnTwitter tweet={tweet} />} */}
							</div>
						</div>
					</div>
				</article>
			</main>
			{/*<main className="mx-auto w-full" id="tip">*/}

			{/*	<PlayerContainer tipLoader={tipLoader}/>*/}
			{/*	<article*/}
			{/*		className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">*/}
			{/*		<div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">*/}
			{/*			<div*/}
			{/*				className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">*/}
			{/*				<div className="flex flex-col lg:col-span-8">*/}
			{/*					<TipBody tipLoader={tipLoader}/>*/}
			{/*				</div>*/}
			{/*			</div>*/}
			{/*		</div>*/}
			{/*	</article>*/}
			{/*</main>*/}
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
			{/*<VideoTranscript transcript={tip.transcript} />*/}
		</div>
	) : null
}

async function TipBody({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const tip = await tipLoader
	if (!tip) return null

	console.log('tip', tip)
	const tipBodySerialized = await serializeMDX(tip.fields.body || '', {
		syntaxHighlighterOptions: {
			theme: 'material-palenight',
			showCopyButton: true,
		},
	})
	return tip.fields.body ? (
		<>
			<div className="prose dark:prose-invert lg:prose-lg w-full max-w-none pb-5 pt-5">
				<MDX contents={tipBodySerialized} />
			</div>
		</>
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
							<TipPlayer videoResourceLoader={videoResourceLoader} />
						</div>
					</div>
				</div>
			</div>
		</Suspense>
	)
}
