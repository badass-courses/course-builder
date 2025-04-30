'use client'

import * as React from 'react'
import { use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import {
	handleTextTrackChange,
	setPreferredTextTrack,
} from '@/hooks/use-mux-player-prefs'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import {
	getAdjacentWorkshopResources,
	type AdjacentResource,
} from '@/utils/get-adjacent-workshop-resources'
import type { AbilityForResource } from '@/utils/get-current-ability-rules'
import { getResourcePath } from '@/utils/resource-paths'
import MuxPlayer, {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'
import pluralize from 'pluralize'

import type {
	ContentResource,
	ModuleProgress,
} from '@coursebuilder/core/schemas'
import {
	useVideoPlayerOverlay,
	type VideoPlayerOverlayAction,
} from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import { revalidateModuleLesson } from '../actions'
import { useWorkshopNavigation } from '../workshops/_components/workshop-navigation-provider'
import { useModuleProgress } from './module-progress-provider'

export function AuthedVideoPlayer({
	title,
	muxPlaybackId,
	className,
	playbackIdLoader,
	abilityLoader,
	resource,
	moduleSlug,
	moduleType,
	...props
}: {
	muxPlaybackId?: string
	title?: string
	playbackIdLoader: Promise<string | null | undefined>
	className?: string
	abilityLoader?: Promise<AbilityForResource>
	resource: ContentResource
	moduleSlug?: string
	moduleType?: 'workshop' | 'tutorial'
} & MuxPlayerProps) {
	const ability = abilityLoader ? use(abilityLoader) : null
	const canView = ability?.canView
	const playbackId = canView ? use(playbackIdLoader) : muxPlaybackId
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const {
		playerPrefs: { playbackRate, volume, autoplay: bingeMode },
		setPlayerPrefs,
		setMuxPlayerRef,
	} = useMuxPlayer()
	const router = useRouter()
	const [currentResource, setCurrentResource] =
		React.useState<ContentResource>(resource)

	const navigation = useWorkshopNavigation()

	const { nextResource, prevResource } = getAdjacentWorkshopResources(
		navigation,
		currentResource.id,
	)

	const isProblemLesson = nextResource?.type === 'solution'

	const { data: nextLessonPlaybackId } =
		api.lessons.getLessonMuxPlaybackId.useQuery(
			{
				lessonIdOrSlug: nextResource?.id as string,
			},
			{
				enabled: canView && Boolean(nextResource),
			},
		)

	const searchParams = useSearchParams()
	const time = searchParams.get('t')
	const { moduleProgress, addLessonProgress } = useModuleProgress()
	const [isPending, startTransition] = React.useTransition()

	const playerProps = {
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
		accentColor: '#DD9637',
		currentTime: time ? Number(time) : 0,
		playbackRate,
		onRateChange: (evt: Event) => {
			const target = evt.target as HTMLVideoElement
			const value = target.playbackRate || 1
			setPlayerPrefs({ playbackRate: value })
		},
		volume,
		onVolumeChange: (evt: Event) => {
			const target = evt.target as HTMLVideoElement
			const value = target.volume || 1
			setPlayerPrefs({ volume: value })
		},
		onLoadedData: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
			handleTextTrackChange(playerRef, setPlayerPrefs)
			setPreferredTextTrack(playerRef)
			setMuxPlayerRef(playerRef)

			if (bingeMode) {
				playerRef?.current?.play()
			}
		},
		onEnded: () => {
			startTransition(async () => {
				await handleOnVideoEnded({
					canView,
					resource,
					nextResource,
					prevResource,
					nextLessonPlaybackId,
					playerRef,
					currentResource,
					dispatchVideoPlayerOverlay,
					setCurrentResource,
					handleSetLessonComplete,
					bingeMode,
					moduleSlug,
					moduleType,
					router,
					moduleProgress,
					addLessonProgress,
				})
			})
		},
		onPlay: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
		},
	} as MuxPlayerProps

	return playbackId ? (
		<MuxPlayer
			metadata={{
				video_id: currentResource.id,
				video_title: title || currentResource.fields?.title,
			}}
			ref={playerRef}
			playbackId={playbackId}
			className={cn(className)}
			{...playerProps}
			{...props}
		/>
	) : null
}

async function handleOnVideoEnded({
	resource,
	playerRef,
	dispatchVideoPlayerOverlay,
	setCurrentResource,
	handleSetLessonComplete,
	moduleProgress,
	addLessonProgress,
	bingeMode,
	moduleSlug,
	moduleType,
	nextResource,
	prevResource,
	nextLessonPlaybackId,
	currentResource,
	canView,
	router,
}: {
	canView?: boolean
	resource: ContentResource
	playerRef: React.RefObject<MuxPlayerRefAttributes | null>
	dispatchVideoPlayerOverlay: React.Dispatch<VideoPlayerOverlayAction>
	setCurrentResource: React.Dispatch<any>
	currentResource: ContentResource
	handleSetLessonComplete: (
		props: handleSetLessonCompleteProps,
	) => Promise<void>
	bingeMode: boolean
	moduleSlug?: string
	moduleType?: 'tutorial' | 'workshop'
	nextResource?: AdjacentResource | null
	prevResource?: AdjacentResource | null
	nextLessonPlaybackId?: string | null
	router: ReturnType<typeof useRouter>
	moduleProgress: ModuleProgress | null
	addLessonProgress: (lessonId: string) => void
}) {
	await track('completed: video', {
		resourceSlug: resource?.fields?.slug,
		resourceType: resource?.type,
		moduleSlug: moduleSlug,
		moduleType: moduleType,
		bingeMode,
	})
	console.log({ nextResource, prevResource, currentResource })
	const isSolution = currentResource?.type === 'solution'

	if (resource?.type === 'exercise') {
		router.push(`${resource?.fields?.slug}/exercise`)
	} else {
		if (
			bingeMode &&
			nextLessonPlaybackId &&
			nextResource &&
			playerRef?.current
		) {
			// dispatchVideoPlayerOverlay({ type: 'LOADING' })
			// playerRef.current.playbackId = nextLessonPlaybackId

			await handleSetLessonComplete({
				currentResource: (isSolution ? prevResource : currentResource) as any,
				moduleProgress,
				addLessonProgress,
			})

			setCurrentResource(nextResource)
			router.push(
				getResourcePath(nextResource.type, nextResource.slug, 'view', {
					parentType: moduleType as string,
					parentSlug: moduleSlug as string,
				}),
			)
		} else if (bingeMode) {
			if (nextResource) {
				dispatchVideoPlayerOverlay({ type: 'LOADING' })
			}

			await handleSetLessonComplete({
				currentResource: (isSolution ? prevResource : currentResource) as any,
				moduleProgress,
				addLessonProgress,
			})
			await revalidateModuleLesson(
				moduleSlug as string,
				currentResource.fields?.slug as string,
				moduleType,
				currentResource.type as 'lesson' | 'exercise' | 'solution',
			)

			if (nextResource) {
				setTimeout(() => {
					router.push(
						getResourcePath(nextResource.type, nextResource.slug, 'view', {
							parentType: moduleType as string,
							parentSlug: moduleSlug as string,
						}),
					)
				}, 250)
			} else {
				dispatchVideoPlayerOverlay({
					type: 'COMPLETED',
					playerRef,
				})
			}
		} else {
			dispatchVideoPlayerOverlay({
				type: 'COMPLETED',
				playerRef,
			})
		}
	}
}

type handleSetLessonCompleteProps = {
	currentResource: ContentResource
	moduleProgress: ModuleProgress | null
	addLessonProgress: (lessonId: string) => void
}

async function handleSetLessonComplete({
	currentResource,
	moduleProgress,
	addLessonProgress,
}: handleSetLessonCompleteProps) {
	const isCurrentLessonCompleted = Boolean(
		moduleProgress?.completedLessons?.some(
			(p) => p.resourceId === currentResource.id && p.completedAt,
		),
	)
	if (!isCurrentLessonCompleted) {
		addLessonProgress(currentResource.id)
		await setProgressForResource({
			resourceId: currentResource.id,
			isCompleted: true,
		})
	}
}
