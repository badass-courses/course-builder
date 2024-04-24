'use client'

import * as React from 'react'
import { use } from 'react'
import {
	handleTextTrackChange,
	setPreferredTextTrack,
	useMuxPlayerPrefs,
} from '@/hooks/use-mux-player-prefs'
import {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

export function AuthedVideoPlayer({
	muxPlaybackId,
	className,
	videoResourceLoader,
}: {
	muxPlaybackId?: string
	videoResourceLoader: Promise<VideoResource | null>
	className?: string
}) {
	const videoResource = use(videoResourceLoader)
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()

	const { playbackRate, volume, setPlayerPrefs } = useMuxPlayerPrefs()

	const playerProps = {
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
		accentColor: '#F28F5A',
		playbackRate,
		onRateChange: (evt: Event) => {
			const target = evt.target as HTMLVideoElement
			const value = target?.playbackRate
			setPlayerPrefs({ playbackRate: value })
		},
		volume,
		onVolumeChange: (evt: Event) => {
			const target = evt.target as HTMLVideoElement
			const value = target?.volume
			setPlayerPrefs({ volume: value })
		},
		onLoadedData: () => {
			handleTextTrackChange(playerRef, setPlayerPrefs)
			setPreferredTextTrack(playerRef)
		},
		onEnded: () => {
			dispatchVideoPlayerOverlay({
				type: 'LESSON_FINISHED',
				playerRef,
			})
		},
		onPlay: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
		},
	} satisfies MuxPlayerProps

	const playbackId = muxPlaybackId || videoResource?.muxPlaybackId

	return (
		<>
			{playbackId ? (
				<MuxPlayer
					ref={playerRef}
					playbackId={playbackId}
					className={cn(className)}
					{...playerProps}
				/>
			) : null}
		</>
	)
}
