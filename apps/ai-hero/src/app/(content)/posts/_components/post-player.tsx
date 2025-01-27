'use client'

import * as React from 'react'
import { use } from 'react'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Spinner from '@/components/spinner'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import {
	handleTextTrackChange,
	setPreferredTextTrack,
	useMuxPlayerPrefs,
} from '@/hooks/use-mux-player-prefs'
import type { List } from '@/lib/lists'
import { setProgressForResource } from '@/lib/progress'
import { api } from '@/trpc/react'
import { getNextUpResourceFromList } from '@/utils/get-nextup-resource-from-list'
import {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'
import { ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { Button } from '@coursebuilder/ui'
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
	const { setMuxPlayerRef } = useMuxPlayer()
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const searchParams = useSearchParams()
	const time = searchParams.get('t')
	const listSlug = searchParams.get('list')

	const { addLessonProgress: addOptimisticLessonProgress } = useProgress()

	const {
		playbackRate,
		volume,
		setPlayerPrefs,
		autoplay: bingeMode,
	} = useMuxPlayerPrefs()
	const playerProps = {
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: thumbnailTime || 0,
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
		onEnded: async () => {
			dispatchVideoPlayerOverlay({ type: 'COMPLETED', playerRef })
			addOptimisticLessonProgress(postId)
			await setProgressForResource({
				resourceId: postId,
				isCompleted: true,
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

	const { list } = useList()
	const nextUp = getNextUpResourceFromList(list, postId)
	const { data: session } = useSession()

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
						'bg-background/85 absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center pb-6 backdrop-blur-md sm:pb-16',
						className,
					)}
				>
					<PostNextUpFromListPagination
						postId={postId}
						className="mt-0 bg-transparent px-0 py-0"
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
