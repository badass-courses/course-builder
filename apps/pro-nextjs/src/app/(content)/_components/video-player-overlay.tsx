'use client'

import React, { use } from 'react'
import { useRouter } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { revalidateTutorialLesson } from '@/app/(content)/tutorials/actions'
import Spinner from '@/components/spinner'
import { VideoBlockNewsletterCta } from '@/components/video-block-newsletter-cta'
import { addProgress } from '@/lib/progress'
import type { Subscriber } from '@/schemas/subscriber'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import { useFormStatus } from 'react-dom'

import type { ModuleProgress } from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/types'
import { Button, Progress, useToast } from '@coursebuilder/ui'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import type { CompletedAction } from '@coursebuilder/ui/hooks/use-video-player-overlay'

export const CompletedLessonOverlay: React.FC<{
	action: CompletedAction
	resource: ContentResource | null
	moduleResource: ContentResource | null
	moduleProgress: ModuleProgress
	nextLesson: ContentResource | null | undefined
}> = ({ action, resource, moduleResource, nextLesson, moduleProgress }) => {
	const { playerRef } = action
	const session = useSession()
	const router = useRouter()
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const [completedLessonsCount, setCompletedLessonsCount] = React.useState(
		moduleProgress?.completedLessonsCount || 0,
	)
	const totalLessonsCount = moduleProgress?.totalLessonsCount || 0
	const percentCompleted = Math.round(
		(completedLessonsCount / totalLessonsCount) * 100,
	)
	const isCurrentLessonCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) => p.contentResourceId === resource?.id && p.completedAt,
		),
	)

	return (
		<div
			aria-live="polite"
			className="bg-background/80 absolute left-0 top-0 z-50 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg backdrop-blur-md"
		>
			<div className="flex flex-col items-center text-center">
				<strong className="pb-2 opacity-75">Next Up:</strong>
				<p className="font-heading text-4xl font-bold text-white lg:text-5xl">
					{nextLesson?.fields?.title}
				</p>
				<div className="mt-8 flex items-center gap-3 text-sm">
					<Progress
						value={percentCompleted}
						className="bg-foreground/20 h-1 w-[150px] sm:w-[200px]"
					/>
					{completedLessonsCount}/{totalLessonsCount} completed
				</div>
			</div>
			<div className="flex w-full items-center justify-center gap-3">
				<Button
					variant="secondary"
					type="button"
					onClick={() => {
						if (playerRef.current) {
							playerRef.current.play()
						}
					}}
				>
					Replay
				</Button>
				{resource && (
					<>
						<form
							action={async () => {
								if (!isCurrentLessonCompleted) {
									await addProgress({
										resourceId: resource.id,
									})
								}
								if (nextLesson && moduleResource) {
									return router.push(nextLesson?.fields?.slug)
								}
							}}
						>
							<ContinueButton
								setCompletedLessonsCount={
									isCurrentLessonCompleted
										? undefined
										: setCompletedLessonsCount
								}
							/>
						</form>
					</>
				)}
			</div>
			<Button
				type="button"
				className="absolute right-5 top-5"
				variant="outline"
				size="icon"
				onClick={() => {
					dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
				}}
			>
				<span className="sr-only">Dismiss</span>
				<XMarkIcon aria-hidden="true" className="h-4 w-4" />
			</Button>
		</div>
	)
}

export const CompletedModuleOverlay: React.FC<{
	action: CompletedAction
	resource: ContentResource | null
	moduleResource: ContentResource | null
}> = ({ action, resource, moduleResource }) => {
	const { playerRef } = action
	const session = useSession()
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()

	React.useEffect(() => {
		if (resource) {
			const run = async () => {
				await addProgress({
					resourceId: resource.id,
				})
			}
			run()
		}
	}, [resource, session])

	return (
		<div
			aria-live="polite"
			className="bg-background/80 absolute left-0 top-0 z-50 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg backdrop-blur-md"
		>
			<p className="font-heading pb-3 text-center text-4xl font-bold">
				Great job!
			</p>
			<p className="text-center text-2xl">
				You&apos;ve completed the {moduleResource?.fields?.title}{' '}
				{moduleResource?.type}.
			</p>
			<div className="flex w-full items-center justify-center gap-3">
				<Button
					variant="secondary"
					type="button"
					onClick={() => {
						if (playerRef.current) {
							playerRef.current.play()
						}
					}}
				>
					Replay
				</Button>
			</div>
			<Button
				type="button"
				className="absolute right-5 top-5"
				variant="outline"
				size="icon"
				onClick={() => {
					dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
				}}
			>
				<span className="sr-only">Dismiss</span>
				<XMarkIcon aria-hidden="true" className="h-4 w-4" />
			</Button>
		</div>
	)
}

const ContinueButton: React.FC<{
	setCompletedLessonsCount?: React.Dispatch<React.SetStateAction<number>>
}> = ({ setCompletedLessonsCount }) => {
	const session = useSession()
	const { pending } = useFormStatus()
	const isCompleted = !Boolean(setCompletedLessonsCount)

	return (
		<Button
			onMouseOver={() => {
				setCompletedLessonsCount && setCompletedLessonsCount((prev) => prev + 1)
			}}
			onMouseOut={() => {
				setCompletedLessonsCount && setCompletedLessonsCount((prev) => prev - 1)
			}}
			onClick={() => {
				setCompletedLessonsCount && setCompletedLessonsCount((prev) => prev + 1)
			}}
			type="submit"
			disabled={pending}
		>
			{isCompleted ? 'Continue' : 'Complete & Continue'}
			{pending && <Spinner className="ml-2 h-4 w-4" />}
		</Button>
	)
}

export const SoftBlockOverlay: React.FC<{
	moduleResource: ContentResource | null
	resource: ContentResource | null
}> = ({ moduleResource, resource }) => {
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const { toast } = useToast()

	return (
		<div
			aria-live="polite"
			className="z-50 flex h-full w-full flex-col items-center justify-center gap-10 overflow-hidden bg-gray-900/90 p-5 py-16 text-lg backdrop-blur-md sm:p-10 sm:py-10 lg:p-16"
		>
			<VideoBlockNewsletterCta
				moduleTitle={moduleResource?.fields?.title}
				onSuccess={async (subscriber?: Subscriber) => {
					if (subscriber && moduleResource && resource) {
						await revalidateTutorialLesson(
							moduleResource?.fields?.slug,
							resource?.fields?.slug,
						)
						dispatchVideoPlayerOverlay({ type: 'LOADING' })
						toast({
							title: 'Check your email',
						})
					}
				}}
			>
				{moduleResource?.fields?.coverImage?.url && (
					<CldImage
						// className="flex sm:hidden"
						src={moduleResource?.fields?.coverImage?.url}
						alt={moduleResource?.fields?.coverImage?.alt}
						width={150}
						height={150}
					/>
				)}
			</VideoBlockNewsletterCta>
		</div>
	)
}

const VideoPlayerOverlay: React.FC<{
	moduleLoader: Promise<ContentResource | null>
	lessonLoader: Promise<ContentResource | null>
	nextResourceLoader: Promise<ContentResource | null | undefined>
	canViewLoader: Promise<boolean>
	moduleProgressLoader: Promise<ModuleProgress>
}> = ({
	moduleLoader,
	lessonLoader,
	nextResourceLoader,
	canViewLoader,
	moduleProgressLoader,
}) => {
	const canView = use(canViewLoader)
	const { state: overlayState, dispatch } = useVideoPlayerOverlay()
	const lesson = use(lessonLoader)
	const moduleResource = use(moduleLoader)
	const nextLesson = use(nextResourceLoader)
	const moduleProgress = use(moduleProgressLoader)

	if (!canView) {
		if (moduleResource?.type === 'tutorial') {
			return (
				<SoftBlockOverlay moduleResource={moduleResource} resource={lesson} />
			)
		}
		return (
			<div
				aria-live="polite"
				className="bg-background/80 z-50 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg backdrop-blur-md"
			>
				{'// TODO: [PRICING WIDGET]'}
			</div>
		)
	}

	switch (overlayState.action?.type) {
		case 'COMPLETED':
			if (nextLesson) {
				return (
					<CompletedLessonOverlay
						nextLesson={nextLesson}
						action={overlayState.action}
						resource={lesson}
						moduleResource={moduleResource}
						moduleProgress={moduleProgress}
					/>
				)
			} else {
				return (
					<CompletedModuleOverlay
						action={overlayState.action}
						resource={lesson}
						moduleResource={moduleResource}
					/>
				)
			}
		case 'LOADING':
			return (
				<div
					aria-live="polite"
					className="bg-background/80 text-foreground z-50 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg backdrop-blur-md"
				>
					<Spinner />
				</div>
			)
		case 'HIDDEN':
			return null
		default:
			return null
	}
}

export default VideoPlayerOverlay
