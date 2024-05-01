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
import { getLesson } from '@/lib/lessons-query'
import { getModuleProgressForUser } from '@/lib/progress'
import { getNextResource } from '@/lib/resources/get-next-resource'
import { Tutorial } from '@/lib/tutorial'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { getViewingAbilityForResource } from '@/utils/get-current-ability-rules'
import { codeToHtml } from '@/utils/shiki'
import { MDXRemote } from 'next-mdx-remote/rsc'

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

import { TutorialLessonList } from '../../../_components/tutorial-lesson-list'

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
	const { session } = await getServerAuthSession()
	const tutorialLoader = getTutorial(params.module)
	const lessonLoader = getLesson(params.lesson)
	const moduleProgressLoader = getModuleProgressForUser(params.module)

	return (
		<div>
			<div className="mx-auto w-full" id="lesson">
				{/* <Suspense
					fallback={
						<div className="bg-background flex h-9 w-full items-center justify-between" />
					}
				>
					<LessonActionBar
						lessonLoader={lessonLoader}
						tutorialLoader={tutorialLoader}
					/>
				</Suspense> */}
				<div className="flex">
					<div className="flex flex-col 2xl:flex-row">
						<div>
							<main className="">
								<PlayerContainer
									params={params}
									lessonLoader={lessonLoader}
									moduleLoader={
										tutorialLoader as unknown as Promise<ContentResource | null>
									}
								/>
							</main>
							<TranscriptContainer
								className="mt-0 hidden 2xl:block"
								lessonLoader={lessonLoader}
							/>
						</div>
						<div className="flex flex-col border-t 2xl:w-[512px] 2xl:flex-shrink-0 2xl:border-l 2xl:border-t-0">
							<Accordion type="single" collapsible className="block lg:hidden">
								<AccordionItem value="contents">
									<AccordionTrigger className="flex w-full items-center p-5 font-medium text-white">
										Tutorial Contents
									</AccordionTrigger>
									<AccordionContent>
										<Suspense
											fallback={
												<div className="flex w-full flex-shrink-0 flex-col gap-2 p-5">
													<Skeleton className="mb-8 h-8 w-full bg-gray-800" />
													{new Array(10).fill(null).map((_, i) => (
														<Skeleton
															key={i}
															className="h-8 w-full bg-gray-800"
														/>
													))}
												</div>
											}
										>
											<TutorialLessonList
												maxHeight="h-[600px]"
												className="max-w-none border-l-0 border-t"
												moduleProgressLoader={moduleProgressLoader}
												tutorialLoader={
													tutorialLoader as unknown as Promise<ContentResource | null>
												}
												lessonLoader={
													lessonLoader as unknown as Promise<ContentResource | null>
												}
											/>
										</Suspense>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
							<div className="flex flex-col py-5 sm:py-8">
								<Suspense fallback={<div className="p-5">Loading...</div>}>
									<LessonBody lessonLoader={lessonLoader} />
								</Suspense>
								<TranscriptContainer
									className="block 2xl:hidden"
									lessonLoader={lessonLoader}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

async function TranscriptContainer({
	lessonLoader,
	className,
}: {
	lessonLoader: Promise<ContentResource | null | undefined>
	className?: string
}) {
	return (
		<div className={cn('mt-10 border-t px-5 pt-8 sm:px-8', className)}>
			<h3 className="font-heading mb-8 text-2xl font-bold leading-none text-white">
				Transcript
			</h3>
			<Suspense fallback={<div className="p-5">Loading...</div>}>
				<Transcript resourceLoader={lessonLoader} />
			</Suspense>
		</div>
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
				<div className="container flex h-9 w-full items-center justify-between px-1">
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
		<div className="flex aspect-video h-full w-full items-center justify-center">
			<Spinner />
		</div>
	)
}

async function PlayerContainer({
	lessonLoader,
	moduleLoader,
	params,
}: {
	lessonLoader: Promise<ContentResource | null>
	moduleLoader: Promise<ContentResource | null>
	params: Props['params']
}) {
	const lesson = await lessonLoader

	if (!lesson) {
		notFound()
	}

	const canViewLoader = getViewingAbilityForResource(
		params.lesson,
		params.module,
	)
	const resource = lesson.resources?.[0]?.resource.id
	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)
	const nextResourceLoader = getNextResource(lesson.id)

	return (
		<VideoPlayerOverlayProvider>
			<div className="relative flex w-full items-center justify-center border-t">
				<Suspense fallback={<PlayerContainerSkeleton />}>
					<VideoPlayerOverlay
						nextResourceLoader={nextResourceLoader}
						moduleLoader={moduleLoader}
						lessonLoader={lessonLoader}
						canViewLoader={canViewLoader}
					/>
					<AuthedVideoPlayer
						className="aspect-video overflow-hidden"
						videoResourceLoader={videoResourceLoader}
						canViewLoader={canViewLoader}
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
