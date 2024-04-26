import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { AuthedVideoPlayer } from '@/app/(content)/_components/authed-video-player'
import VideoPlayerOverlay from '@/app/(content)/_components/video-player-overlay'
import { Transcript } from '@/app/(content)/_components/video-transcript-renderer'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { getLesson } from '@/lib/lessons-query'
import { Tutorial } from '@/lib/tutorial'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { PencilIcon } from '@heroicons/react/24/outline'
import { MDXRemote } from 'next-mdx-remote/rsc'
import ReactMarkdown from 'react-markdown'

import { ContentResource } from '@coursebuilder/core/types'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Skeleton,
} from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const lesson = await getLesson(params.lesson)

	if (!lesson) {
		return parent as Metadata
	}

	const previousImages = (await parent).openGraph?.images || []

	return {
		title: lesson.fields?.title,
	}
}

type Props = {
	params: { lesson: string; module: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LessonPage({ params }: Props) {
	headers()
	const tutorialLoader = getTutorial(params.module)
	const lessonLoader = getLesson(params.lesson)

	return (
		<div>
			<div className="mx-auto w-full" id="lesson">
				<Suspense
					fallback={
						<div className="bg-background container flex h-9 w-full items-center justify-between" />
					}
				>
					<LessonActionBar
						lessonLoader={lessonLoader}
						tutorialLoader={tutorialLoader}
					/>
				</Suspense>
				<main className="container px-0">
					<PlayerContainer lessonLoader={lessonLoader} />
				</main>
				<div className="container flex flex-col-reverse border-t px-0 lg:flex-row lg:border-x">
					<div className="flex flex-col py-8">
						<Suspense fallback={<div>Loading...</div>}>
							<LessonBody lessonLoader={lessonLoader} />
						</Suspense>
						<div className="mt-10 border-t px-5 pt-8 sm:px-8">
							<h3 className="font-heading mb-8 text-2xl font-bold leading-none text-white">
								Transcript
							</h3>
							<Suspense fallback={<div>Loading...</div>}>
								<Transcript resourceLoader={lessonLoader} />
							</Suspense>
						</div>
					</div>
					<Suspense
						fallback={
							<div className="flex w-full max-w-sm flex-shrink-0 flex-col gap-2 border-l p-5">
								<Skeleton className="mb-8 h-8 w-full bg-gray-800" />
								{new Array(10).fill(null).map((_, i) => (
									<Skeleton key={i} className="h-8 w-full bg-gray-800" />
								))}
							</div>
						}
					>
						<TutorialLessonList
							className="hidden lg:block"
							params={params}
							tutorialLoader={tutorialLoader}
						/>
					</Suspense>
					<Accordion type="single" collapsible className="block lg:hidden">
						<AccordionItem value="contents">
							<AccordionTrigger className="flex w-full items-center p-5 font-medium text-white">
								Tutorial Contents
							</AccordionTrigger>
							<AccordionContent>
								<Suspense
									fallback={
										<div className="flex w-full max-w-sm flex-shrink-0 flex-col gap-2 border-l p-5">
											<Skeleton className="mb-8 h-8 w-full bg-gray-800" />
											{new Array(10).fill(null).map((_, i) => (
												<Skeleton key={i} className="h-8 w-full bg-gray-800" />
											))}
										</div>
									}
								>
									<TutorialLessonList
										params={params}
										className="max-w-none border-l-0 border-t"
										tutorialLoader={tutorialLoader}
									/>
								</Suspense>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</div>
	)
}

async function TutorialLessonList({
	tutorialLoader,
	params,
	className,
}: {
	tutorialLoader: Promise<Tutorial>
	params: Props['params']
	className?: string
}) {
	const { ability } = await getServerAuthSession()
	const tutorial = await tutorialLoader

	if (!tutorial) {
		return null
	}

	return (
		<nav className={cn('w-full max-w-sm flex-shrink-0 border-l', className)}>
			<div className="flex flex-col p-5">
				<div className="flex items-center gap-2">
					<Link
						href="/tutorials"
						className="font-heading text-primary text-lg font-medium hover:underline"
					>
						Tutorial
					</Link>{' '}
				</div>
				<Link
					className="font-heading text-balance text-2xl font-bold hover:underline"
					href={`/tutorials/${tutorial.fields.slug}`}
				>
					{tutorial.fields.title}
				</Link>
			</div>
			<div className="flex flex-col gap-3 border-t pb-16 pt-3">
				{tutorial.resources.map((resource) => {
					return (
						<div key={resource.resourceId}>
							{resource.resource.type === 'section' ? (
								<h3 className="px-5 py-2 text-lg font-bold">
									{resource.resource.fields.title}
								</h3>
							) : (
								<div className="flex w-full flex-row hover:bg-gray-900">
									<Link
										className="w-full"
										href={`/tutorials/${tutorial.fields.slug}/${resource.resource.fields.slug}`}
									>
										{resource.resource.fields.title}
									</Link>
									{ability.can('create', 'Content') ? (
										<div className="w-full justify-end">
											<Button asChild size="sm">
												<Link
													className="text-xs"
													href={`/tutorials/${tutorial.fields.slug}/${resource.resource.fields.slug}/edit`}
												>
													edit
												</Link>
											</Button>
										</div>
									) : null}
								</div>
							)}
							{resource.resource.resources.length > 0 && (
								<ol>
									{resource.resource.resources.map((lesson, i) => {
										const isActive =
											lesson.resource.fields.slug === params.lesson

										return (
											<li
												key={lesson.resourceId}
												className="flex w-full items-center"
											>
												<Link
													className={cn(
														'hover:bg-secondary flex w-full items-baseline px-5 py-2',
														{
															'bg-secondary text-primary': isActive,
														},
													)}
													href={`/tutorials/${tutorial.fields.slug}/${lesson.resource.fields.slug}`}
												>
													<span
														className="w-6 pr-1 text-sm opacity-60"
														aria-hidden="true"
													>
														{i + 1}
													</span>
													{lesson.resource.fields.title}
												</Link>
												{ability.can('create', 'Content') ? (
													<Button
														asChild
														variant="outline"
														size="icon"
														className="scale-75"
													>
														<Link
															href={`/tutorials/${tutorial.fields.slug}/${lesson.resource.fields.slug}/edit`}
														>
															<PencilIcon className="w-3" />
														</Link>
													</Button>
												) : null}
											</li>
										)
									})}
								</ol>
							)}
						</div>
					)
				})}
			</div>
		</nav>
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
				<div className="container flex h-9 w-full items-center justify-between border-x px-1">
					<div />
					<Button size="sm" asChild>
						<Link
							href={`/tutorials/${tutorial?.fields.slug}/${lesson.fields?.slug || lesson.id}/edit`}
						>
							Edit Lesson
						</Link>
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
	lessonLoader,
}: {
	lessonLoader: Promise<ContentResource | null>
}) {
	const lesson = await lessonLoader

	if (!lesson) {
		notFound()
	}

	const resource = lesson.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
		<VideoPlayerOverlayProvider>
			<div className="relative flex aspect-video h-auto w-full items-center justify-center">
				<VideoPlayerOverlay />
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
		<article>
			<h1 className="font-heading w-full text-balance px-5 pb-5 text-3xl font-bold text-white sm:px-8 sm:text-4xl lg:text-5xl">
				{lesson.fields?.title}
			</h1>
			<div className="px-5 sm:px-8">
				<Contributor />
			</div>
			{lesson.fields?.body && (
				<div className="prose dark:prose-invert mt-5 max-w-none border-t px-5 pt-8 sm:px-8">
					<MDXRemote
						source={lesson.fields.body}
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
