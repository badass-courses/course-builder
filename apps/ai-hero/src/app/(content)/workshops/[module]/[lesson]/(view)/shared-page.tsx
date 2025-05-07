import { Suspense } from 'react'
import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AuthedVideoPlayer } from '@/app/(content)/_components/authed-video-player'
import { LessonControls } from '@/app/(content)/_components/lesson-controls'
import VideoPlayerOverlay from '@/app/(content)/_components/video-player-overlay'
import { Transcript } from '@/app/(content)/_components/video-transcript-renderer'
import UpNext from '@/app/(content)/workshops/_components/up-next'
import { WorkshopPricing } from '@/app/(content)/workshops/_components/workshop-pricing-server'
import Exercise from '@/app/(content)/workshops/[module]/[lesson]/(view)/exercise/_components/exercise'
import { Contributor } from '@/components/contributor'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import type { Lesson } from '@/lib/lessons'
import {
	getLessonMuxPlaybackId,
	getLessonVideoTranscript,
} from '@/lib/lessons-query'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import {
	getAbilityForResource,
	type AbilityForResource,
} from '@/utils/get-current-ability-rules'
import { Github } from 'lucide-react'

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

import { CopyProblemPromptButton } from '../../../_components/copy-problem-prompt-button'
import { LessonBody } from '../../../_components/lesson-body'

export async function LessonPage({
	lesson,
	problem,
	searchParams,
	params,
	lessonType = 'lesson',
}: {
	params: { module: string; lesson: string }
	exerciseLoader?: Promise<Lesson | null> | null | undefined
	lesson: Lesson | null
	problem?: Lesson | null
	searchParams: { [key: string]: string | string[] | undefined }
	lessonType?: 'lesson' | 'exercise' | 'solution'
}) {
	if (!lesson) {
		notFound()
	}

	const abilityLoader = getAbilityForResource(params.lesson, params.module)
	const mdxContentPromise = compileMDX(lesson?.fields?.body || '')

	return (
		<ActiveHeadingProvider>
			<main className="w-full">
				{lessonType === 'exercise' ? (
					<Exercise
						moduleType="workshop"
						moduleSlug={params.module}
						lesson={lesson}
					/>
				) : (
					<PlayerContainer
						lesson={lesson}
						searchParams={searchParams}
						params={params}
						lessonType={lessonType}
					/>
				)}
				<div className="container relative max-w-screen-xl pb-16 sm:pb-24 md:px-10 lg:px-16">
					<div className="relative z-10">
						<article className="flex h-full flex-col">
							<LessonTitle lesson={lesson} />
							<div className="relative mb-10 flex w-full items-center justify-between gap-3">
								<LessonActionBar
									lesson={lesson}
									problem={problem}
									abilityLoader={abilityLoader}
								/>
								<LessonControls
									lesson={lesson}
									problem={problem}
									className="flex justify-end"
								/>
							</div>

							<Suspense
								fallback={
									<div className="flex flex-col gap-3">
										<Skeleton className="dark:bg-foreground/10 bg-foreground/5 h-12 w-full rounded" />
										<Skeleton className="dark:bg-foreground/10 bg-foreground/5 h-5 w-2/3 rounded" />
										<Skeleton className="dark:bg-foreground/10 bg-foreground/5 h-5 w-1/2 rounded" />
									</div>
								}
							>
								<LessonBody
									lesson={lesson}
									abilityLoader={abilityLoader}
									mdxContentPromise={mdxContentPromise}
								/>
							</Suspense>
							<TranscriptContainer
								lessonId={lesson?.id}
								abilityLoader={abilityLoader}
							/>
							<UpNext currentResourceId={lesson?.id} />
							{/* <Accordion type="single" collapsible className="mt-4">
							<AccordionItem value="contents">
								<AccordionTrigger className="flex w-full items-center font-medium">
									Workshop Contents
								</AccordionTrigger>
								<AccordionContent>
									<Suspense
										fallback={
											<div className="flex w-full flex-shrink-0 flex-col gap-2 p-5">
												<Skeleton className="h-24 w-full bg-gray-100" />
												{new Array(10).fill(null).map((_, i) => (
													<Skeleton
														key={i}
														className="h-8 w-full bg-gray-100"
													/>
												))}
											</div>
										}
									>
										<WorkshopResourceList
											currentLessonSlug={params.lesson}
											className="max-w-none"
										/>
									</Suspense>
								</AccordionContent>
							</AccordionItem>
						</Accordion> */}
						</article>
					</div>
				</div>
			</main>
		</ActiveHeadingProvider>
	)
}

async function TranscriptContainer({
	lessonId,
	className,
	abilityLoader,
}: {
	lessonId: string
	className?: string
	abilityLoader: Promise<AbilityForResource>
}) {
	const transcriptLoader = getLessonVideoTranscript(lessonId)

	return (
		<div className={cn('pt-4', className)}>
			<Suspense fallback={<div className="p-5"></div>}>
				<Transcript
					transcriptLoader={transcriptLoader}
					abilityLoader={abilityLoader}
				/>
			</Suspense>
		</div>
	)
}

async function PlayerContainer({
	lesson,
	lessonType = 'lesson',
	searchParams,
	params,
}: {
	lesson: Lesson | null
	lessonType?: 'lesson' | 'exercise' | 'solution'
	searchParams: { [key: string]: string | string[] | undefined }
	params: { module: string; lesson: string }
}) {
	if (!lesson) {
		notFound()
	}

	const abilityLoader = getAbilityForResource(params.lesson, params.module)
	const playbackIdLoader = getLessonMuxPlaybackId(lesson.id)

	return (
		<VideoPlayerOverlayProvider>
			<section
				aria-label="video"
				className="relative mb-10 flex flex-col items-center justify-center border-b bg-black"
			>
				<Suspense
					fallback={
						<PlayerContainerSkeleton className="h-full max-h-[75vh] w-full bg-black" />
					}
				>
					<WorkshopPricing
						moduleSlug={params.module}
						searchParams={searchParams}
					>
						{(pricingProps) => (
							<VideoPlayerOverlay
								resource={lesson}
								abilityLoader={abilityLoader}
								pricingProps={pricingProps}
								moduleType="workshop"
								moduleSlug={params.module}
							/>
						)}
					</WorkshopPricing>
					<AuthedVideoPlayer
						className="aspect-video h-full max-h-[75vh] w-full max-w-full overflow-hidden"
						playbackIdLoader={playbackIdLoader}
						resource={lesson}
						abilityLoader={abilityLoader}
						moduleSlug={params.module}
						moduleType="workshop"
						title={lesson.fields?.title}
					/>
				</Suspense>
			</section>
		</VideoPlayerOverlayProvider>
	)
}

async function LessonTitle({ lesson }: { lesson: Lesson | null }) {
	if (!lesson) return null

	return (
		<div>
			<Badge
				className="mb-1 border-none bg-transparent px-0 text-xs uppercase opacity-75"
				variant="outline"
			>
				{lesson.type}
			</Badge>
			<h1 className="fluid-3xl mb-4 font-bold">{lesson.fields?.title}</h1>
		</div>
	)
}

async function LessonActionBar({
	lesson,
	problem,
	abilityLoader,
}: {
	lesson: Lesson | null
	problem?: Lesson | null
	abilityLoader: Promise<AbilityForResource>
}) {
	if (!lesson) return null

	const githubUrl = lesson.fields?.github
	const gitpodUrl = lesson.fields?.gitpod

	return (
		<div className="flex items-center gap-8">
			{/* <Contributor className="flex [&_img]:w-8" /> */}
			{githubUrl && (
				<Button asChild variant="outline" className="h-11 text-base">
					<Link href={githubUrl} target="_blank">
						<Github className="text-muted-foreground mr-2 h-4 w-4" />
						Source Code
					</Link>
				</Button>
			)}
			<React.Suspense fallback={null}>
				<CopyProblemPromptButton
					abilityLoader={abilityLoader}
					lesson={lesson}
					problem={problem}
				/>
			</React.Suspense>
			{gitpodUrl && (
				<Button variant="outline" asChild className="h-11 text-base">
					<Link href={gitpodUrl} target="_blank">
						<svg
							width={16}
							height={16}
							viewBox={'0 0 16 16'}
							aria-hidden="true"
							role={'img'}
							xmlns="http://www.w3.org/2000/svg"
							className="text-muted-foreground mr-2 h-4 w-4"
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
	)
}

// async function LessonBody({
// 	lesson,
// 	params,
// }: {
// 	lesson: Lesson | null
// 	params: { module: string; lesson: string }
// }) {
// 	if (!lesson) {
// 		notFound()
// 	}

// 	const { content } = await compileMDX(lesson?.fields?.body || '')
// 	const abilityLoader = await getAbilityForResource(
// 		params.lesson,
// 		params.module,
// 	)
// 	const canView = abilityLoader?.canView

// 	if (!canView) {
// 		return (
// 			<article className="prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl mt-10 max-w-none [&_[data-pre]]:max-w-4xl">
// 				<p>This lesson is locked. Please upgrade to view it.</p>
// 			</article>
// 		)
// 	}

// 	return (
// 		<article className="prose dark:prose-a:text-primary prose-a:text-orange-600 sm:prose-lg lg:prose-xl prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl mt-10 max-w-none [&_[data-pre]]:max-w-4xl">
// 			{content}
// 		</article>
// 	)
// }
