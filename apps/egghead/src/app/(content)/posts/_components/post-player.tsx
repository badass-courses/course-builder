'use client'

import * as React from 'react'
import { use } from 'react'
import Spinner from '@/components/spinner'
import { type MuxPlayerProps } from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import { type VideoResource } from '@coursebuilder/core/schemas/video-resource'
import { cn } from '@coursebuilder/ui/utils/cn'

export function PostPlayer({
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
		accentColor: '#926FDD',
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
