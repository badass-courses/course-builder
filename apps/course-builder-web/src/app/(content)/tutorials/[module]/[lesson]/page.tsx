import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TipPlayer } from '@/app/(content)/tips/_components/tip-player'
import { courseBuilderAdapter } from '@/db'
import { Lesson } from '@/lib/lessons'
import { getLesson } from '@/lib/lessons-query'
import { Tutorial } from '@/lib/tutorial'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import ReactMarkdown from 'react-markdown'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const lesson = await getLesson(params.lesson)

	if (!lesson) {
		return parent as Metadata
	}

	const previousImages = (await parent).openGraph?.images || []

	const ogImage = getOGImageUrlForResource(lesson)

	return {
		title: lesson.fields?.title,
		openGraph: {
			images: [ogImage, ...previousImages],
		},
	}
}

type Props = {
	params: Promise<{ lesson: string; module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LessonPage(props: Props) {
	const params = await props.params
	await headers()
	const tutorialLoader = getTutorial(params.module)
	const lessonLoader = getLesson(params.lesson)
	return (
		<div>
			<main className="mx-auto w-full" id="lesson">
				<Suspense
					fallback={
						<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
					}
				>
					<LessonActionBar
						lessonLoader={lessonLoader}
						tutorialLoader={tutorialLoader}
					/>
				</Suspense>
				<PlayerContainer lessonLoader={lessonLoader} />
				<article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
					<div className="max-w-(--breakpoint-lg) mx-auto w-full pb-5 lg:px-5">
						<div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
							<div className="flex flex-col lg:col-span-8">
								<LessonBody lessonLoader={lessonLoader} />
							</div>
							<div className="flex w-full flex-col lg:col-span-3">
								<Suspense>
									<TutorialLessonList tutorialLoader={tutorialLoader} />
								</Suspense>
							</div>
						</div>
					</div>
				</article>
			</main>
		</div>
	)
}

async function TutorialLessonList({
	tutorialLoader,
}: {
	tutorialLoader: Promise<Tutorial>
}) {
	const tutorial = await tutorialLoader

	if (!tutorial) {
		return null
	}

	return (
		<>
			<h3>
				<Link href={`/tutorials/${tutorial.fields.slug}`}>
					{tutorial.fields.title}
				</Link>
			</h3>
			{tutorial.resources.map((resource) => {
				return (
					<div key={resource.resourceId}>
						{resource.resource.type === 'section' ? (
							<h4>{resource.resource.fields.title}</h4>
						) : (
							<h4>{resource.resource.fields.title}</h4>
						)}
						{resource.resource.resources.length > 0 && (
							<ul>
								{resource.resource.resources.map((lesson) => {
									return (
										<li key={lesson.resourceId}>
											<Link
												href={`/tutorials/${tutorial.fields.slug}/${lesson.resource.fields.slug}`}
											>
												{lesson.resource.fields.title}
											</Link>
										</li>
									)
								})}
							</ul>
						)}
					</div>
				)
			})}
		</>
	)
}

async function LessonActionBar({
	lessonLoader,
	tutorialLoader,
}: {
	lessonLoader: Promise<ContentResource | null | undefined>
	tutorialLoader: Promise<Tutorial | null | undefined>
}) {
	const { ability } = await getServerAuthSession()
	const lesson = await lessonLoader
	const tutorial = await tutorialLoader

	return (
		<>
			{lesson && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button size="sm" asChild>
						<Link
							href={`/tutorials/${tutorial?.fields.slug}/${lesson.fields?.slug || lesson.id}/edit`}
						>
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
	lessonLoader,
}: {
	lessonLoader: Promise<Lesson | null>
}) {
	const lesson = await lessonLoader
	const displayOverlay = false

	if (!lesson) {
		notFound()
	}

	const resource = lesson.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
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
							<TipPlayer videoResourceLoader={videoResourceLoader} />
						</div>
					</div>
				</div>
			</div>
		</Suspense>
	)
}

async function LessonBody({
	lessonLoader,
}: {
	lessonLoader: Promise<ContentResource | null | undefined>
}) {
	const lesson = await lessonLoader

	if (!lesson) {
		notFound()
	}

	return (
		<>
			<h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
				{lesson.fields?.title}
			</h1>

			{lesson.fields?.body && (
				<>
					<ReactMarkdown className="prose dark:prose-invert">
						{lesson.fields?.body}
					</ReactMarkdown>
				</>
			)}
		</>
	)
}
