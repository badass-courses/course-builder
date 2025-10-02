'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Spinner from '@/components/spinner'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import {
	handleTextTrackChange,
	setPreferredTextTrack,
	useMuxPlayerPrefs,
} from '@/hooks/use-mux-player-prefs'
import { setProgressForResource } from '@/lib/progress'
import { track } from '@/utils/analytics'
import { getNextUpResourceFromList } from '@/utils/get-nextup-resource-from-list'
import MuxPlayer, {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import PostNextUpFromListPagination from '../../_components/post-next-up-from-list-pagination'
import { useList } from '../../[post]/_components/list-provider'
import { useProgress } from '../../[post]/_components/progress-provider'

export function PostPlayer({
	muxPlaybackId,
	className,
	videoResource,
	postId,
	thumbnailTime,
	title,
}: {
	muxPlaybackId?: string
	videoResource: VideoResource
	className?: string
	postId: string
	thumbnailTime?: number
	title?: string
}) {
	// const ability = abilityLoader ? use(abilityLoader) : null
	// const canView = ability?.canView
	// const playbackId = muxPlaybackId

	const { dispatch: dispatchVideoPlayerOverlay, state } =
		useVideoPlayerOverlay()
	const {
		setMuxPlayerRef,
		muxPlayerRef,
		setPlayerPrefs,
		playerPrefs: { playbackRate, volume, autoplay },
	} = useMuxPlayer()
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const searchParams = useSearchParams()
	const time = searchParams.get('t')

	const { addLessonProgress: addOptimisticLessonProgress } = useProgress()
	const { list } = useList()
	const nextUp = list && getNextUpResourceFromList(list, postId)
	const router = useRouter()

	React.useEffect(() => {
		setMuxPlayerRef(playerRef)
	}, [playerRef])

	const playerProps = {
		playsInline: true,
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: autoplay ? 0 : thumbnailTime || 0,
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

			if (autoplay) {
				playerRef.current?.play().catch(console.warn)
			}
		},
		onEnded: async () => {
			if (autoplay && nextUp) {
				router.push(`/${nextUp?.resource.fields?.slug}`)
			} else {
				dispatchVideoPlayerOverlay({ type: 'COMPLETED', playerRef })
			}
			addOptimisticLessonProgress(postId)
			await setProgressForResource({
				resourceId: postId,
				isCompleted: true,
			})
			await track('video_completed', {
				video_id: videoResource?.id,
				video_title: title || videoResource?.id,
			})
		},
		onPlay: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
		},
	} as MuxPlayerProps

	const playbackId =
		videoResource?.state === 'ready'
			? muxPlaybackId || videoResource?.muxPlaybackId
			: null

	return (
		<div className={cn('relative h-full w-full', className)}>
			{playbackId ? (
				<MuxPlayer
					metadata={{
						video_id: videoResource?.id,
						video_title: title || videoResource?.id,
					}}
					playbackId={playbackId}
					className={cn(className)}
					ref={playerRef}
					{...playerProps}
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-gray-300">
					<Spinner />
				</div>
			)}
			{state.action?.type === 'COMPLETED' && (
				<div
					className={cn(
						'bg-background/85 dark absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center pb-6 backdrop-blur-md sm:pb-16',
						className,
					)}
				>
					<PostNextUpFromListPagination
						postId={postId}
						className="text-white! mt-0 border-0 bg-transparent px-0 py-0 dark:bg-transparent"
						documentIdsToSkip={list?.resources.map((resource) => resource.id)}
					/>
				</div>
			)}
		</div>
	)
}

export function SimplePostPlayer({
	ref,
	muxPlaybackId,
	className,
	videoResource,
	handleVideoTimeUpdate,
	thumbnailTime,
}: {
	ref?: React.RefObject<MuxPlayerRefAttributes | null>
	muxPlaybackId?: string
	videoResource: VideoResource
	className?: string
	handleVideoTimeUpdate?: (e: Event) => void
	thumbnailTime?: number
}) {
	const playerProps = {
		id: 'mux-player',
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: thumbnailTime,
		accentColor: '#DD9637',
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
	} as MuxPlayerProps

	const playbackId =
		videoResource?.state === 'ready'
			? muxPlaybackId || videoResource?.muxPlaybackId
			: null

	return (
		<>
			{playbackId ? (
				<>
					<MuxPlayer
						ref={ref}
						metadata={{
							video_id: videoResource?.id,
							video_title: videoResource?.title,
						}}
						onTimeUpdate={(e) => {
							handleVideoTimeUpdate && handleVideoTimeUpdate(e)
						}}
						playbackId={playbackId}
						className={cn(className)}
						{...playerProps}
					/>
				</>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-gray-300">
					<Spinner />
				</div>
			)}
		</>
	)
}
