'use client'

import * as React from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import {
	handleTextTrackChange,
	setPreferredTextTrack,
	useMuxPlayerPrefs,
} from '@/hooks/use-mux-player-prefs'
import MuxPlayer, {
	type MuxPlayerProps,
	type MuxPlayerRefAttributes,
} from '@mux/mux-player-react'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import type { ContentResource } from '@coursebuilder/core/types'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

export function AuthedVideoPlayer({
	muxPlaybackId,
	className,
	videoResourceLoader,
	canViewLoader,
	resource,
	...props
}: {
	muxPlaybackId?: string
	videoResourceLoader: Promise<VideoResource | null>
	className?: string
	canViewLoader?: Promise<boolean>
	resource?: ContentResource
} & MuxPlayerProps) {
	const canView = canViewLoader ? use(canViewLoader) : true
	const videoResource = canView ? use(videoResourceLoader) : null
	const playerRef = React.useRef<MuxPlayerRefAttributes>(null)
	const { dispatch: dispatchVideoPlayerOverlay } = useVideoPlayerOverlay()
	const { playbackRate, volume, setPlayerPrefs } = useMuxPlayerPrefs()
	const { setMuxPlayerRef } = useMuxPlayer()
	const router = useRouter()

	const playerProps = {
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
		accentColor: '#3D63DD',
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
		},
		onEnded: () => {
			if (resource?.type === 'exercise') {
				router.push(`${resource?.fields?.slug}/exercise`)
			} else {
				dispatchVideoPlayerOverlay({
					type: 'COMPLETED',
					playerRef,
				})
			}
		},
		onPlay: () => {
			dispatchVideoPlayerOverlay({ type: 'HIDDEN' })
		},
	} as MuxPlayerProps

	const playbackId = muxPlaybackId || videoResource?.muxPlaybackId

	return playbackId ? (
		<MuxPlayer
			ref={playerRef}
			playbackId={playbackId}
			className={cn(className)}
			{...playerProps}
			{...props}
		/>
	) : null
}
