'use client'

import * as React from 'react'
import { use } from 'react'
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
import { getNextUpResourceFromList } from '@/utils/get-nextup-resource-from-list'
import {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'
import { ArrowRight } from 'lucide-react'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { Button } from '@coursebuilder/ui'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

export function PostPlayer({
	muxPlaybackId,
	className,
	videoResource,
	listLoader,
	postId,
}: {
	muxPlaybackId?: string
	videoResource: VideoResource
	className?: string
	listLoader: Promise<List | null>
	postId: string
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
	const {
		playbackRate,
		volume,
		setPlayerPrefs,
		autoplay: bingeMode,
	} = useMuxPlayerPrefs()
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
			dispatchVideoPlayerOverlay({ type: 'COMPLETED', playerRef })
		},
		onPlay: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
		},
	} as MuxPlayerProps

	const playbackId =
		videoResource?.state === 'ready'
			? muxPlaybackId || videoResource?.muxPlaybackId
			: null

	const list = use(listLoader)
	const nextUp = list && getNextUpResourceFromList(list, postId)

	return (
		<div className={cn('relative h-full w-full', className)}>
			{playbackId ? (
				<MuxPlayer
					metadata={{
						video_id: videoResource?.id,
						video_title: videoResource?.title,
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

			{state.action?.type === 'COMPLETED' && nextUp && (
				<div
					className={cn(
						'bg-background/85 absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center pb-6 backdrop-blur-md sm:pb-16',
						className,
					)}
				>
					<h2 className="sm:fluid-2xl fluid-xl font-semibold sm:mb-3">
						Continue
					</h2>
					<Button
						className="text-primary inline-flex items-center gap-2 sm:text-lg lg:text-xl"
						asChild
						variant="link"
					>
						<Link href={`/${nextUp.resource.fields?.slug}`}>
							{nextUp.resource.fields?.title} <ArrowRight className="w-4" />
						</Link>
					</Button>
				</div>
			)}
		</div>
	)
}

export function SimplePostPlayer({
	muxPlaybackId,
	className,
	videoResource,
}: {
	muxPlaybackId?: string
	videoResource: VideoResource
	className?: string
}) {
	const playerProps = {
		id: 'mux-player',
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
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
				<MuxPlayer
					metadata={{
						video_id: videoResource?.id,
						video_title: videoResource?.title,
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
		</>
	)
}
