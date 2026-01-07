import { Suspense } from 'react'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { AuthedVideoPlayer } from '@/app/(content)/_components/authed-video-player'
import { LessonControls } from '@/app/(content)/_components/lesson-controls'
import VideoPlayerOverlay from '@/app/(content)/_components/video-player-overlay'
import { Transcript } from '@/app/(content)/_components/video-transcript-renderer'
import PostToC from '@/app/(content)/posts/_components/post-toc'
import UpNext from '@/app/(content)/workshops/_components/up-next'
import { WorkshopPricing } from '@/app/(content)/workshops/_components/workshop-pricing-server'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { env } from '@/env.mjs'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import type { Lesson } from '@/lib/lessons'
import {
	getLessonMuxPlaybackId,
	getLessonVideoTranscript,
} from '@/lib/lessons-query'
import { MinimalWorkshop } from '@/lib/workshops'
import { cn } from '@/utils/cn'
import { compileMDX } from '@/utils/compile-mdx'
import {
	getAbilityForResource,
	type AbilityForResource,
} from '@/utils/get-current-ability-rules'

import { Skeleton } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import { LessonBody } from '../../../_components/lesson-body'

export async function LessonPage({
	lesson,
	problem,
	searchParams,
	params,
	lessonType = 'lesson',
	workshop,
}: {
	params: { module: string; lesson: string }
	exerciseLoader?: Promise<Lesson | null> | null | undefined
	lesson: Lesson | null
	problem?: Lesson | null
	searchParams: { [key: string]: string | string[] | undefined }
	lessonType?: 'lesson' | 'exercise' | 'solution'
	workshop: MinimalWorkshop | null
}) {
	if (!lesson) {
		notFound()
	}

	const abilityLoader = getAbilityForResource(params.lesson, params.module)

	const mdxContentPromise = compileMDX(
		lesson?.fields?.body || '',
		{},
		{},
		{ lessonId: lesson.id },
	)

	const ability = await abilityLoader

	if (!ability.canViewLesson) {
		redirect(`/workshops/${params.module}`)
	}

	return (
		<main className="w-full">
			<PlayerContainer
				lesson={lesson}
				searchParams={searchParams}
				params={params}
				lessonType={lessonType}
				workshop={workshop}
				ability={ability}
			/>
			<LessonControls
				abilityLoader={abilityLoader}
				lesson={lesson}
				problem={problem}
				moduleSlug={params.module}
			/>
			<div className="max-w-(--breakpoint-xl) container relative px-5 md:px-10 lg:px-14">
				<div className="relative z-10">
					<article className="">
						<LessonTitle lesson={lesson} />
						{lesson?.fields?.body && lesson?.fields?.body?.length > 300 && (
							<PostToC
								markdown={lesson?.fields?.body}
								className="top-0 -mx-5 mb-5 md:-mx-10 lg:-mx-14"
							/>
						)}
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
								workshop={workshop}
							/>
						</Suspense>
						<TranscriptContainer
							lessonId={lesson?.id}
							abilityLoader={abilityLoader}
						/>

						{/* <Accordion type="single" collapsible className="mt-4">
								<AccordionItem value="contents">
									<AccordionTrigger className="flex w-full items-center font-medium">
										Workshop Contents
									</AccordionTrigger>
									<AccordionContent>
										<Suspense
											fallback={
												<div className="flex w-full shrink-0 flex-col gap-2 p-5">
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
			<Suspense fallback={null}>
				<UpNext
					className="rounded-none border-x-0 border-b-0 border-t"
					currentResourceId={lesson?.id}
					abilityLoader={abilityLoader}
				/>
			</Suspense>
		</main>
	)
}

async function TranscriptContainer({
	lessonId,
	className,
	abilityLoader,
}: {
	lessonId: string
	className?: string
	abilityLoader: Promise<
		Omit<AbilityForResource, 'canView'> & {
			canViewWorkshop: boolean
			canViewLesson: boolean
			isPendingOpenAccess: boolean
		}
	>
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
	workshop,
	ability,
}: {
	lesson: Lesson | null
	lessonType?: 'lesson' | 'exercise' | 'solution'
	searchParams: { [key: string]: string | string[] | undefined }
	params: { module: string; lesson: string }
	workshop: MinimalWorkshop | null
	ability: Omit<AbilityForResource, 'canView'> & {
		canViewWorkshop: boolean
		canViewLesson: boolean
		isPendingOpenAccess: boolean
	}
}) {
	if (!lesson) {
		notFound()
	}

	const abilityLoader = getAbilityForResource(params.lesson, params.module)

	// const playbackIdLoader = getLessonMuxPlaybackId(lesson.id)
	const muxPlaybackId = ability.canViewLesson
		? await getLessonMuxPlaybackId(lesson.id)
		: null
	const videoResource = lesson?.resources?.find(({ resource, resourceId }) => {
		return resource.type === 'videoResource'
	})
	const thumbnailUrl =
		videoResource &&
		`${env.NEXT_PUBLIC_URL}/api/thumbnails?videoResourceId=${videoResource.resourceId}&time=${lesson.fields?.thumbnailTime || 0}`

	if (!muxPlaybackId) {
		return null
	}

	return (
		<VideoPlayerOverlayProvider>
			<section
				aria-label="video"
				className="dark relative flex flex-col items-center justify-center border-b bg-black text-white dark:text-white"
			>
				{thumbnailUrl && (
					<Image
						src={thumbnailUrl}
						alt="thumbnail"
						fill
						className="blur-xs absolute inset-0 z-0 h-full w-full bg-cover opacity-20"
						priority
					/>
				)}
				{/* <div
					className="absolute inset-0 z-0 h-full w-full bg-cover opacity-20 blur-xs"
					style={{
						backgroundImage: `url(${thumbnailUrl})`,
					}}
				/> */}
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
								workshop={workshop}
							/>
						)}
					</WorkshopPricing>
					<AuthedVideoPlayer
						className="aspect-video h-full max-h-[75vh] w-full max-w-full overflow-hidden"
						muxPlaybackId={muxPlaybackId}
						// playbackIdLoader={playbackIdLoader}
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
			{/* <Badge
				className="mb-1 border-none bg-transparent px-0 text-xs uppercase opacity-75"
				variant="outline"
			>
				{lesson.type}
			</Badge> */}
			<h1 className="mb-8 text-3xl font-bold sm:text-3xl lg:text-4xl dark:text-white">
				{lesson.fields?.title}
			</h1>
		</div>
	)
}
