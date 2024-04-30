'use client'

import React, { use } from 'react'
import { useRouter } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import Spinner from '@/components/spinner'
import { VideoBlockNewsletterCta } from '@/components/video-block-newsletter-cta'
import type { Subscriber } from '@/schemas/subscriber'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import { useFormStatus } from 'react-dom'

import type { ContentResource } from '@coursebuilder/core/types'
import { Button, useToast } from '@coursebuilder/ui'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import type { CompletedAction } from '@coursebuilder/ui/hooks/use-video-player-overlay'

import { completeLesson, revalidateTutorialLesson } from '../tutorials/actions'

export const CompletedLessonOverlay: React.FC<{
	action: CompletedAction
	resource: ContentResource | null
	moduleResource: ContentResource | null
	nextLesson: ContentResource | null | undefined
}> = ({ action, resource, moduleResource, nextLesson }) => {
	const { playerRef } = action
	const session = useSession()
	const router = useRouter()
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()

	return (
		<div
			aria-live="polite"
			className="bg-background/80 absolute left-0 top-0 z-50 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg backdrop-blur-md"
		>
			<p className="font-heading text-center text-4xl font-bold">
				Next Up: {nextLesson?.fields?.title}
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
				{resource && (
					<>
						<form
							action={async () => {
								if (session?.data?.user) {
									await completeLesson({
										resourceId: resource.id,
									})
									if (nextLesson && moduleResource) {
										router.push(
											`/tutorials/${moduleResource?.fields?.slug}/${nextLesson?.fields?.slug}`,
										)
									}
								} else {
									if (nextLesson && moduleResource) {
										router.push(
											`/tutorials/${moduleResource?.fields?.slug}/${nextLesson?.fields?.slug}`,
										)
									}
								}
							}}
						>
							<ContinueButton />
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
		if (resource && session?.data?.user) {
			const triggerCompleteLesson = async () => {
				await completeLesson({
					resourceId: resource.id,
				})
			}
			triggerCompleteLesson()
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

const ContinueButton = () => {
	const session = useSession()
	const { pending } = useFormStatus()

	return (
		<Button type="submit" disabled={pending}>
			{session?.data?.user && 'Complete & '}Continue
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
			className="bg-background/80 z-50 flex h-full w-full flex-col items-center justify-center gap-10 overflow-hidden p-5 py-16 text-lg backdrop-blur-md sm:p-10 sm:py-10 lg:aspect-video lg:p-16"
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
}> = ({ moduleLoader, lessonLoader, nextResourceLoader, canViewLoader }) => {
	const canView = use(canViewLoader)
	const { state: overlayState, dispatch } = useVideoPlayerOverlay()
	const lesson = use(lessonLoader)
	const moduleResource = use(moduleLoader)
	const nextLesson = use(nextResourceLoader)

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
					className="bg-background/80 z-50 flex aspect-video h-full w-full flex-col items-center justify-center gap-10 p-5 text-lg backdrop-blur-md"
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
