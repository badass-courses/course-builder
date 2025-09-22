import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AuthedVideoPlayer } from '@/app/(content)/_components/authed-video-player'
import { LessonControls } from '@/app/(content)/_components/lesson-controls'
import VideoPlayerOverlay from '@/app/(content)/_components/video-player-overlay'
import { Transcript } from '@/app/(content)/_components/video-transcript-renderer'
import UpNext from '@/app/(content)/workshops/_components/up-next'
import { WorkshopPricing } from '@/app/(content)/workshops/_components/workshop-pricing-server'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import { env } from '@/env.mjs'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import type { Exercise } from '@/lib/exercises'
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
import { joinUrlPath } from '@/utils/url'

import { Button, Skeleton } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import { LessonBody } from '../../../_components/lesson-body'

export async function LessonPage({
	lesson,
	problem,
	searchParams,
	params,
	lessonType = 'lesson',
	workshop,
	exercise,
}: {
	params: { module: string; lesson: string }
	exerciseLoader?: Promise<Lesson | null> | null | undefined
	lesson: Lesson | null
	problem?: Lesson | null
	searchParams: { [key: string]: string | string[] | undefined }
	lessonType?: 'lesson' | 'exercise' | 'solution'
	workshop: MinimalWorkshop | null
	exercise?: Exercise | null
}) {
	if (!lesson) {
		notFound()
	}

	const abilityLoader = getAbilityForResource(params.lesson, params.module)
	const mdxContentPromise = compileMDX(lesson?.fields?.body || '')

	const ability = await abilityLoader

	if (!ability.canViewLesson) {
		redirect(`/workshops/${params.module}`)
	}

	return (
		<ActiveHeadingProvider>
			<main className="w-full">
				{lessonType === 'exercise' ? (
					<div className="dark:bg-muted bg-card flex h-full max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-lg border-x border-b border-t p-10 md:aspect-video">
						<div className="flex max-w-lg flex-col items-center justify-center gap-4 text-center">
							<h2 className="text-2xl font-semibold">
								Stop! <span aria-hidden="true">😅</span>
							</h2>
							<p className="text-center text-base">
								This is not a video course.
							</p>
							<p className="text-balance text-center text-base">
								This workshop is intended to be worked through by completing
								hands on exercises in your local development environment. It's
								not meant for passive consumption.
							</p>

							{workshop?.fields?.workshopApp?.externalUrl &&
							exercise?.fields?.workshopApp?.path ? (
								<div className="mt-5 flex w-full max-w-xs flex-col items-center gap-2 text-center">
									{workshop.fields.github && (
										<Button
											asChild
											className="w-full"
											size="lg"
											variant="outline"
										>
											<Link
												target="_blank"
												rel="noopener noreferrer"
												href={workshop.fields.github}
											>
												Setup Workshop App
											</Link>
										</Button>
									)}
									<div className="flex w-full flex-col gap-2">
										<Button asChild className="w-full" size="lg">
											<Link
												target="_blank"
												rel="noopener noreferrer"
												href={joinUrlPath(
													workshop.fields.workshopApp.externalUrl,
													exercise.fields.workshopApp.path,
												)}
											>
												Open in Local Workshop App
											</Link>
										</Button>
										<p className="text-foreground/80 text-xs">
											Must be running on localhost:
											{workshop.fields.workshopApp?.port || '5639'}
										</p>
									</div>
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									Exercise link unavailable — missing workshop app configuration
									or exercise.
								</p>
							)}
						</div>
					</div>
				) : (
					<PlayerContainer
						lesson={lesson}
						searchParams={searchParams}
						params={params}
						lessonType={lessonType}
						workshop={workshop}
						ability={ability}
					/>
				)}
				<LessonControls
					abilityLoader={abilityLoader}
					lesson={lesson}
					problem={problem}
				/>
				<div className="container relative max-w-4xl pb-16 sm:px-5 sm:pb-24">
					<div className="relative z-10">
						<article className="">
							<LessonTitle lesson={lesson} />

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
							<Suspense fallback={null}>
								<UpNext
									currentResourceId={lesson?.id}
									abilityLoader={abilityLoader}
								/>
							</Suspense>
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
				className="dark relative -mx-8 flex flex-col items-center justify-center overflow-hidden bg-black text-white sm:mx-0 sm:rounded-lg dark:text-white"
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
						className="aspect-video h-full max-h-[75vh] w-full max-w-full overflow-hidden shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)]"
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
			<h1 className="sm:fluid-2xl fluid-xl mb-8 font-bold tracking-tight dark:text-white">
				{lesson.fields?.title}
			</h1>
		</div>
	)
}
