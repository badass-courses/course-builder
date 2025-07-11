import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TipPlayer } from '@/app/(content)/tips/_components/tip-player'
import { courseBuilderAdapter } from '@/db'
import { type Tip } from '@/lib/tips'
import { getTip } from '@/lib/tips-query'
import { getTranscript } from '@/lib/transcript-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

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
	const tipLoader = getTip(params.slug)
	return (
		<div>
			<main className="mx-auto w-full" id="tip">
				<Suspense
					fallback={
						<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
					}
				>
					<TipActionBar tipLoader={tipLoader} />
				</Suspense>

				<PlayerContainer tipLoader={tipLoader} />
				<article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
					<div className="max-w-(--breakpoint-lg) mx-auto w-full pb-5 lg:px-5">
						<div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
							<div className="flex flex-col lg:col-span-8">
								<TipBody tipLoader={tipLoader} />
							</div>
						</div>
					</div>
				</article>
			</main>
		</div>
	)
}

async function TipActionBar({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const { ability } = await getServerAuthSession()
	const tip = await tipLoader

	return (
		<>
			{tip && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button size="sm" asChild>
						<Link href={`/tips/${tip.fields.slug || tip.id}/edit`}>Edit</Link>
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
			<div className="max-w-(--breakpoint-lg) flex w-full flex-col">
				<div className="relative aspect-video">
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
				<div className="max-w-(--breakpoint-lg) flex w-full flex-col">
					<div className="relative aspect-video">
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

async function TipBody({ tipLoader }: { tipLoader: Promise<Tip | null> }) {
	const tip = await tipLoader

	if (!tip) {
		notFound()
	}

	const resource = tip.resources?.[0]?.resource.id

	const transcript = await getTranscript(resource)

	return (
		<>
			<h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
				{tip.fields.title}
			</h1>

			{tip.fields.body && (
				<>
					<ReactMarkdown className="prose dark:prose-invert">
						{tip.fields.body}
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
