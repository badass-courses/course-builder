'use client'

import * as React from 'react'
import { use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { revalidateModuleLesson } from '@/app/(content)/actions'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import {
	handleTextTrackChange,
	setPreferredTextTrack,
	useMuxPlayerPrefs,
} from '@/hooks/use-mux-player-prefs'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import type { AbilityForResource } from '@/utils/get-current-ability-rules'
import MuxPlayer, {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'
import pluralize from 'pluralize'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	useVideoPlayerOverlay,
	type VideoPlayerOverlayAction,
} from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

export function AuthedVideoPlayer({
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
	playbackIdLoader?: Promise<string | null | undefined>
	className?: string
	abilityLoader?: Promise<AbilityForResource>
	resource: ContentResource
	moduleSlug?: string
	moduleType?: 'workshop' | 'tutorial'
} & MuxPlayerProps) {
	const ability = abilityLoader ? use(abilityLoader) : null
	const canView = ability?.canView
	const playbackId = muxPlaybackId
		? muxPlaybackId
		: canView && playbackIdLoader
			? use(playbackIdLoader)
			: muxPlaybackId
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const {
		playbackRate,
		volume,
		setPlayerPrefs,
		autoplay: bingeMode,
	} = useMuxPlayerPrefs()
	const { setMuxPlayerRef } = useMuxPlayer()
	const router = useRouter()
	const [currentResource, setCurrentResource] =
		React.useState<ContentResource>(resource)

	const { data: nextResource } = api.progress.getNextResource.useQuery(
		{
			lessonId: currentResource.id,
			moduleSlug: moduleSlug,
		},
		{
			enabled: Boolean(moduleSlug),
		},
	)

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

	const playerProps = {
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
		accentColor: '#00A156',
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

			if (bingeMode && props.autoPlay !== false) {
				playerRef?.current?.play()
			}
		},
		onEnded: async () => {
			await handleOnVideoEnded({
				canView,
				resource,
				nextResource,
				nextLessonPlaybackId,
				isFullscreen,
				playerRef,
				currentResource,
				dispatchVideoPlayerOverlay,
				setCurrentResource,
				handleSetLessonComplete,
				bingeMode,
				moduleSlug,
				moduleType,
				router,
			})
		},
		onPlay: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
		},
	} as MuxPlayerProps

	const [isFullscreen, setIsFullscreen] = React.useState(false)

	const handleFullscreenChange = React.useCallback(() => {
		setIsFullscreen((fullscreen) => {
			console.log('setting fullscreen', !fullscreen)
			if (fullscreen && currentResource) {
				router.push(
					`${moduleType ? `/${pluralize(moduleType)}` : ''}/${moduleSlug}/${currentResource?.fields?.slug}?t=${Math.floor(Number(playerRef?.current?.currentTime))}`,
				)
			}
			return !fullscreen
		})
	}, [playerRef, nextResource, setIsFullscreen])

	React.useEffect(() => {
		const currentPlayer = playerRef?.current
		if (currentPlayer) {
			currentPlayer.addEventListener('fullscreenchange', handleFullscreenChange)
		}

		return () => {
			if (currentPlayer) {
				currentPlayer.removeEventListener(
					'fullscreenchange',
					handleFullscreenChange,
				)
			}
		}
	}, [playerRef, handleFullscreenChange])
	return playbackId ? (
		<MuxPlayer
			metadata={{
				video_id: currentResource.id,
				video_title: currentResource.fields?.title,
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
	isFullscreen,
	playerRef,
	dispatchVideoPlayerOverlay,
	setCurrentResource,
	handleSetLessonComplete,
	bingeMode,
	moduleSlug,
	moduleType,
	nextResource,
	nextLessonPlaybackId,
	currentResource,
	canView,
	router,
}: {
	canView?: boolean
	resource: ContentResource
	isFullscreen: boolean
	playerRef: React.RefObject<MuxPlayerRefAttributes | null>
	dispatchVideoPlayerOverlay: React.Dispatch<VideoPlayerOverlayAction>
	setCurrentResource: React.Dispatch<ContentResource>
	currentResource: ContentResource
	handleSetLessonComplete: (
		props: handleSetLessonCompleteProps,
	) => Promise<void>
	bingeMode: boolean
	moduleSlug?: string
	moduleType?: 'tutorial' | 'workshop'
	nextResource?: ContentResource | null
	nextLessonPlaybackId?: string | null
	router: ReturnType<typeof useRouter>
}) {
	if (resource?.type === 'exercise') {
		router.push(`${resource?.fields?.slug}/exercise`)
	} else {
		if (
			isFullscreen &&
			bingeMode &&
			nextLessonPlaybackId &&
			nextResource &&
			playerRef?.current
		) {
			dispatchVideoPlayerOverlay({ type: 'LOADING' })
			playerRef.current.playbackId = nextLessonPlaybackId
			await handleSetLessonComplete({ currentResource, moduleSlug, moduleType })
			setCurrentResource(nextResource)
		} else if (bingeMode) {
			if (nextResource) {
				dispatchVideoPlayerOverlay({ type: 'LOADING' })
			}
			await handleSetLessonComplete({ currentResource, moduleSlug, moduleType })
			if (nextResource) {
				router.push(
					`${moduleType ? `/${pluralize(moduleType)}` : ''}/${moduleSlug}/${nextResource?.fields?.slug}`,
				)
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
	moduleSlug?: string
	moduleType?: 'tutorial' | 'workshop'
}

async function handleSetLessonComplete({
	currentResource,
	moduleSlug,
	moduleType,
}: handleSetLessonCompleteProps) {
	await setProgressForResource({
		resourceId: currentResource.id,
		isCompleted: true,
	})
	if (moduleSlug && moduleType && currentResource?.fields?.slug) {
		await revalidateModuleLesson(
			moduleSlug,
			currentResource?.fields?.slug,
			moduleType,
			currentResource.type as 'lesson' | 'exercise' | 'solution',
		)
	}
}
