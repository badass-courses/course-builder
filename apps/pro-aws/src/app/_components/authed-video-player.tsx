'use client'

import * as React from 'react'
import { use } from 'react'
import { type MuxPlayerProps } from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
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
	const playerProps = {
		id: 'mux-player',
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
	} as MuxPlayerProps

	const videoResource = use(videoResourceLoader)

	const playbackId = muxPlaybackId || videoResource?.muxPlaybackId

	return (
		<>
			{playbackId ? (
				<MuxPlayer
					playbackId={playbackId}
					className={cn(className)}
					{...playerProps}
				/>
			) : null}
		</>
	)
}
