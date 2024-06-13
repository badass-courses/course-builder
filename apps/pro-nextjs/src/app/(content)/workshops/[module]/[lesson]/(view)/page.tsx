import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { AuthedVideoPlayer } from '@/app/(content)/_components/authed-video-player'
import VideoPlayerOverlay from '@/app/(content)/_components/video-player-overlay'
import { Transcript } from '@/app/(content)/_components/video-transcript-renderer'
import {
	LessonProgressToggle,
	LessonProgressToggleSkeleton,
} from '@/app/(content)/tutorials/_components/lesson-progress-toggle'
import { TutorialLessonList } from '@/app/(content)/tutorials/_components/tutorial-lesson-list'
import Spinner from '@/components/spinner'
import { courseBuilderAdapter } from '@/db'
import type { Lesson } from '@/lib/lessons'
import { getExerciseSolution, getLesson } from '@/lib/lessons-query'
import { getModuleProgressForUser } from '@/lib/progress'
import { getNextResource } from '@/lib/resources/get-next-resource'
import { Tutorial } from '@/lib/tutorial'
import { getTutorial } from '@/lib/tutorials-query'
import { getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { cn } from '@/utils/cn'
import { getViewingAbilityForResource } from '@/utils/get-current-ability-rules'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { codeToHtml } from '@/utils/shiki'
import { CK_SUBSCRIBER_KEY } from '@skillrecordings/config'
import { MDXRemote } from 'next-mdx-remote/rsc'

import type {
	ModuleProgress,
	ResourceProgress,
} from '@coursebuilder/core/schemas'
import { ContentResource } from '@coursebuilder/core/types'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	Skeleton,
} from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import Exercise from './exercise/_components/exercise'

export async function generateMetadata(
	{ params }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const lesson = await getLesson(params.lesson)

	if (!lesson) {
		return parent as Metadata
	}

	const previousImages = (await parent).openGraph?.images || []

	return {
		title: lesson.fields?.title,
		openGraph: {
			images: [getOGImageUrlForResource(lesson)],
		},
	}
}

export type Props = {
	params: { lesson: string; module: string }
	isSolution?: boolean
	isExercise?: boolean
}

export default async function LessonPage({
	params,
	isSolution = false,
	isExercise = false,
}: Props) {
	headers()
	const workshopLoader = getWorkshop(params.module)
	const lessonLoader = isSolution
		? getExerciseSolution(params.lesson)
		: getLesson(params.lesson)
	const exerciseLoader = isSolution ? getLesson(params.lesson) : null

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
								{isExercise ? (
									<Suspense fallback={<PlayerContainerSkeleton />}>
										<Exercise
											moduleLoader={
												workshopLoader as unknown as Promise<ContentResource | null>
											}
											resourceLoader={lessonLoader}
										/>
									</Suspense>
								) : (
									<PlayerContainer
										params={params}
										lessonLoader={lessonLoader}
										exerciseLoader={exerciseLoader}
										moduleLoader={
											workshopLoader as unknown as Promise<ContentResource | null>
										}
										moduleProgressLoader={moduleProgressLoader}
									/>
								)}
							</main>
							<TranscriptContainer
								className="mt-0 hidden 2xl:block"
								lessonLoader={lessonLoader}
							/>
						</div>
						<div className="flex flex-col border-t 2xl:w-[512px] 2xl:flex-shrink-0 2xl:border-l 2xl:border-t-0">
							<Accordion type="single" collapsible className="block lg:hidden">
								<AccordionItem value="contents">
									<AccordionTrigger className="flex w-full items-center p-5 font-medium">
										Tutorial Contents
									</AccordionTrigger>
									<AccordionContent>
										<Suspense
											fallback={
												<div className="flex w-full flex-shrink-0 flex-col gap-2 p-5">
													<Skeleton className="bg-muted mb-8 h-8 w-full" />
													{new Array(10).fill(null).map((_, i) => (
														<Skeleton key={i} className="bg-muted h-8 w-full" />
													))}
												</div>
											}
										>
											<TutorialLessonList
												maxHeight="h-[600px]"
												className="max-w-none border-l-0 border-t"
												moduleProgressLoader={moduleProgressLoader}
												tutorialLoader={
													workshopLoader as unknown as Promise<ContentResource | null>
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
									<LessonBody
										lessonLoader={lessonLoader}
										exerciseLoader={exerciseLoader}
										moduleProgressLoader={moduleProgressLoader}
									/>
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
			<h3 className="font-heading mb-8 text-2xl font-bold leading-none">
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

export function PlayerContainerSkeleton() {
	return (
		<div className="flex aspect-video h-full w-full items-center justify-center">
			<Spinner />
		</div>
	)
}

async function PlayerContainer({
	lessonLoader,
	exerciseLoader,
	moduleLoader,
	moduleProgressLoader,
	params,
}: {
	lessonLoader: Promise<ContentResource | null>
	exerciseLoader: Promise<ContentResource | null> | null
	moduleLoader: Promise<ContentResource | null>
	moduleProgressLoader: Promise<ModuleProgress>
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
	const videoResourceId = lesson.resources?.find(
		(resource) => resource.resource.type === 'videoResource',
	)?.resource.id

	const videoResourceLoader =
		courseBuilderAdapter.getVideoResource(videoResourceId)
	const nextResourceLoader = getNextResource(lesson.id, params.module)

	return (
		<VideoPlayerOverlayProvider>
			<div className="relative flex w-full items-center justify-center">
				<Suspense fallback={<PlayerContainerSkeleton />}>
					<VideoPlayerOverlay
						nextResourceLoader={nextResourceLoader}
						moduleLoader={moduleLoader}
						resource={lesson}
						exerciseLoader={exerciseLoader}
						canViewLoader={canViewLoader}
						moduleProgressLoader={moduleProgressLoader}
					/>
					<AuthedVideoPlayer
						className="aspect-video overflow-hidden"
						videoResourceLoader={videoResourceLoader}
						resource={lesson}
						canViewLoader={canViewLoader}
					/>
				</Suspense>
			</div>
		</VideoPlayerOverlayProvider>
	)
}

async function LessonBody({
	lessonLoader,
	exerciseLoader,
	moduleProgressLoader,
}: {
	lessonLoader: Promise<Lesson | null>
	exerciseLoader: Promise<Lesson | null> | null
	moduleProgressLoader: Promise<ModuleProgress>
}) {
	const lesson = await lessonLoader
	const { session } = await getServerAuthSession()
	const cookieStore = cookies()
	const ckSubscriber = cookieStore.has(CK_SUBSCRIBER_KEY)

	if (!lesson) {
		notFound()
	}

	const exercise = await exerciseLoader

	const githubUrl = lesson.fields?.github
	const gitpodUrl = lesson.fields?.gitpod

	return (
		<article>
			<div className="flex w-full flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:px-8 2xl:flex-col">
				<div className="w-full">
					<Badge className="mb-2 text-xs uppercase" variant="secondary">
						{lesson.type}
					</Badge>
					<h1 className="font-heading fluid-2xl w-full pb-5 font-bold">
						{lesson.fields?.title}
					</h1>
					<div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-5 sm:justify-center">
							<Contributor />
							{(githubUrl || gitpodUrl) && (
								<div className="bg-border h-5 w-px" aria-hidden="true" />
							)}
							<div className="flex items-center justify-center gap-2">
								{githubUrl && (
									<Button variant="outline" asChild className="gap-1">
										<Link href={githubUrl} target="_blank">
											<svg
												width={16}
												height={16}
												viewBox={'0 0 16 16'}
												aria-hidden="true"
												role={'img'}
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fillRule="evenodd"
													clipRule="evenodd"
													fill="currentColor"
													d="M8,0.2c-4.4,0-8,3.6-8,8c0,3.5,2.3,6.5,5.5,7.6 C5.9,15.9,6,15.6,6,15.4c0-0.2,0-0.7,0-1.4C3.8,14.5,3.3,13,3.3,13c-0.4-0.9-0.9-1.2-0.9-1.2c-0.7-0.5,0.1-0.5,0.1-0.5 c0.8,0.1,1.2,0.8,1.2,0.8C4.4,13.4,5.6,13,6,12.8c0.1-0.5,0.3-0.9,0.5-1.1c-1.8-0.2-3.6-0.9-3.6-4c0-0.9,0.3-1.6,0.8-2.1 c-0.1-0.2-0.4-1,0.1-2.1c0,0,0.7-0.2,2.2,0.8c0.6-0.2,1.3-0.3,2-0.3c0.7,0,1.4,0.1,2,0.3c1.5-1,2.2-0.8,2.2-0.8 c0.4,1.1,0.2,1.9,0.1,2.1c0.5,0.6,0.8,1.3,0.8,2.1c0,3.1-1.9,3.7-3.7,3.9C9.7,12,10,12.5,10,13.2c0,1.1,0,1.9,0,2.2 c0,0.2,0.1,0.5,0.6,0.4c3.2-1.1,5.5-4.1,5.5-7.6C16,3.8,12.4,0.2,8,0.2z"
												/>
											</svg>
											Code
										</Link>
									</Button>
								)}
								{gitpodUrl && (
									<Button variant="outline" asChild className="gap-1">
										<Link href={gitpodUrl} target="_blank">
											<svg
												width={16}
												height={16}
												viewBox={'0 0 16 16'}
												aria-hidden="true"
												role={'img'}
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													fill="currentColor"
													d="M9.355.797a1.591 1.591 0 0 1-.58 2.156L4.122 5.647a.401.401 0 0 0-.2.348v4.228a.4.4 0 0 0 .2.347l3.683 2.133a.39.39 0 0 0 .39 0l3.685-2.133a.4.4 0 0 0 .2-.347v-2.63L8.766 9.485a1.55 1.55 0 0 1-2.127-.6 1.592 1.592 0 0 1 .593-2.153l4.739-2.708c1.443-.824 3.228.232 3.228 1.91v4.61a3.015 3.015 0 0 1-1.497 2.612l-4.23 2.448a2.937 2.937 0 0 1-2.948 0l-4.229-2.448A3.016 3.016 0 0 1 .8 10.544v-4.87A3.016 3.016 0 0 1 2.297 3.06L7.225.208a1.55 1.55 0 0 1 2.13.589Z"
												/>
											</svg>
											Gitpod
										</Link>
									</Button>
								)}
							</div>
						</div>
						{(session?.user || ckSubscriber) &&
						(lesson.type === 'lesson' || lesson.type === 'solution') ? (
							<Suspense fallback={<LessonProgressToggleSkeleton />}>
								<LessonProgressToggle
									// if we are on solution, pass in exercise as lesson for completing
									lesson={
										lesson.type === 'solution' && exercise ? exercise : lesson
									}
									moduleProgressLoader={moduleProgressLoader}
								/>
							</Suspense>
						) : null}
					</div>
				</div>
			</div>
			{lesson.fields?.body && (
				<div className="prose mt-5 max-w-none border-t px-5 pt-8 sm:px-8">
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
