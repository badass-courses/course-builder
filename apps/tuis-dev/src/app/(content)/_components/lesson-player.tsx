'use client'

import * as React from 'react'
import { type MuxPlayerProps } from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { cn } from '@coursebuilder/ui/utils/cn'

export function LessonPlayer({
	muxPlaybackId,
	className,
	videoResource,
	title,
}: {
	muxPlaybackId?: string
	videoResource: VideoResource | null | undefined
	className?: string
	title?: string
}) {
	const playerProps = {
		id: 'mux-player',
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
		accentColor: '#536AFF',
	} as MuxPlayerProps

	const playbackId = muxPlaybackId || videoResource?.muxPlaybackId

	return (
		<>
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
			) : null}
		</>
	)
}
