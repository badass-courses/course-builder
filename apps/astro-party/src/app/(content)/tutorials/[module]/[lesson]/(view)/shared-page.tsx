import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/app/_components/contributor'
import { AuthedVideoPlayer } from '@/app/(content)/_components/authed-video-player'
import { LessonControls } from '@/app/(content)/_components/lesson-controls'
import VideoPlayerOverlay from '@/app/(content)/_components/video-player-overlay'
import { Transcript } from '@/app/(content)/_components/video-transcript-renderer'
import { TutorialLessonList } from '@/app/(content)/tutorials/_components/tutorial-lesson-list'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import type { Lesson } from '@/lib/lessons'
import {
	getExerciseSolution,
	getLesson,
	getLessonMuxPlaybackId,
	getLessonVideoTranscript,
} from '@/lib/lessons-query'
import { Module } from '@/lib/module'
import { getTutorial } from '@/lib/tutorials-query'
import { cn } from '@/utils/cn'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'
import { codeToHtml } from '@/utils/shiki'
import { MDXRemote } from 'next-mdx-remote/rsc'

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

import { LessonProvider } from '../_components/lesson-context'
import Exercise from './exercise/_components/exercise'

export type Props = {
	params: { lesson: string; module: string }
	lessonPageType?: 'exercise' | 'solution' | 'default'
}

export async function LessonPageWrapper({
	params,
	lessonPageType = 'default',
}: Props) {
	const lesson =
		lessonPageType === 'solution'
			? await getExerciseSolution(params.lesson)
			: await getLesson(params.lesson)

	const exercise =
		lessonPageType === 'exercise' ? lesson : await getLesson(params.lesson)

	const moduleLoader = getTutorial(params.module)

	return (
		<LessonProvider lesson={lesson}>
			<LessonPage
				lessonPageType={lessonPageType}
				lesson={lesson}
				exercise={exercise}
				params={params}
				moduleLoader={moduleLoader}
			/>
		</LessonProvider>
	)
}

async function LessonPage({
	exercise,
	lesson,
	params,
	moduleLoader,
	lessonPageType,
}: {
	exercise: Lesson | null
	lesson: Lesson | null
	params: { module: string; lesson: string }
	moduleLoader: Promise<Module | null>
	lessonPageType: 'exercise' | 'solution' | 'default'
}) {
	if (!lesson) {
		notFound()
	}
	return (
		<div>
			<div className="mx-auto w-full" id="lesson">
				<div className="flex">
					<div className="flex flex-col 2xl:flex-row">
						<div>
							<main className="">
								{lessonPageType === 'exercise' && exercise ? (
									<Suspense fallback={<PlayerContainerSkeleton />}>
										<Exercise
											exercise={exercise}
											moduleType="tutorial"
											moduleSlug={params.module}
										/>
									</Suspense>
								) : (
									<PlayerContainer
										lesson={lesson}
										exercise={lesson}
										params={params}
									/>
								)}
							</main>
							<div className="relative">
								<LessonControls
									moduleType="tutorial"
									exercise={exercise}
									lesson={lesson}
									className="absolute right-8 top-8 hidden justify-end 2xl:flex"
								/>
								<TranscriptContainer
									lessonId={lesson.id}
									className="mt-0 hidden 2xl:block"
								/>
							</div>
						</div>
						<div className="flex flex-col border-t 2xl:w-[512px] 2xl:shrink-0 2xl:border-l 2xl:border-t-0">
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
												tutorialLoader={moduleLoader}
												lesson={lesson}
											/>
										</Suspense>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
							<div className="flex flex-col py-5 sm:py-8">
								<Suspense fallback={<div className="p-5">Loading...</div>}>
									<LessonBody lesson={lesson} exercise={exercise} />
								</Suspense>
								<TranscriptContainer
									className="block 2xl:hidden"
									lessonId={lesson.id}
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
	className,
	lessonId,
}: {
	className?: string
	lessonId: string
}) {
	const transcriptLoader = getLessonVideoTranscript(lessonId)
	return (
		<div className={cn('mt-10 border-t px-5 pt-8 sm:px-8', className)}>
			<h3 className="font-heading mb-8 text-2xl font-bold leading-none">
				Transcript
			</h3>
			<Transcript transcriptLoader={transcriptLoader} />
		</div>
	)
}

async function PlayerContainer({
	lesson,
	exercise,
	params,
}: {
	lesson: Lesson | null
	exercise: Lesson | null
	params: { module: string; lesson: string }
}) {
	if (!lesson) {
		notFound()
	}

	const abilityLoader = getAbilityForResource(params.lesson, params.module)

	const playbackIdLoader = getLessonMuxPlaybackId(lesson.id)

	return (
		<VideoPlayerOverlayProvider>
			<div className="relative flex w-full items-center justify-center">
				<Suspense fallback={<PlayerContainerSkeleton />}>
					<VideoPlayerOverlay
						resource={lesson}
						abilityLoader={abilityLoader}
						moduleType="tutorial"
						moduleSlug={params.module}
					/>
					<AuthedVideoPlayer
						moduleSlug={params.module}
						moduleType="tutorial"
						className="aspect-video overflow-hidden"
						playbackIdLoader={playbackIdLoader}
						resource={lesson}
						abilityLoader={abilityLoader}
					/>
				</Suspense>
			</div>
		</VideoPlayerOverlayProvider>
	)
}

async function LessonBody({
	lesson,
	exercise,
}: {
	lesson: Lesson | null
	exercise: Lesson | null
}) {
	if (!lesson) {
		notFound()
	}

	const githubUrl = lesson.fields?.github
	const gitpodUrl = lesson.fields?.gitpod

	return (
		<article>
			<div className="flex w-full flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:px-8 2xl:flex-col">
				<div className="w-full">
					<div className="mb-2 flex w-full items-center justify-between">
						<Badge className="text-xs uppercase" variant="outline">
							{lesson.type}
						</Badge>
						<LessonControls
							exercise={exercise}
							moduleType="tutorial"
							lesson={lesson}
							className="hidden sm:flex 2xl:hidden"
						/>
					</div>
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
					</div>
				</div>
			</div>
			<LessonControls
				exercise={exercise}
				moduleType="tutorial"
				lesson={lesson}
				className="mt-5 flex justify-end border-t px-5 pt-5 sm:hidden"
			/>
			{lesson.fields?.body && (
				<div className="prose mt-5 max-w-none border-t px-5 pt-8 sm:px-8">
					<MDXRemote
						source={lesson.fields.body}
						options={{ blockJS: false }}
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
