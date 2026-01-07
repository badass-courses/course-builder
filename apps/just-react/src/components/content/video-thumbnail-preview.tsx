'use client'

import * as React from 'react'
import Image from 'next/image'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import { cn } from '@coursebuilder/ui/utils/cn'

export interface VideoThumbnailPreviewHandle {
	getCurrentTime: () => number
}

/**
 * VideoThumbnailPreview displays a static thumbnail that transforms into
 * a muted autoplay video preview on hover - YouTube style.
 *
 * Can be controlled externally via `isHovering` prop, or manages its own
 * hover state if not provided.
 *
 * Use ref to access `getCurrentTime()` for capturing playback position.
 */
export const VideoThumbnailPreview = React.forwardRef<
	VideoThumbnailPreviewHandle,
	{
		/** Static thumbnail URL to show by default */
		thumbnailUrl: string
		/** Mux playback ID for the video preview */
		muxPlaybackId: string
		/** Alt text and video metadata title */
		title: string
		/** Thumbnail time offset in seconds */
		thumbnailTime?: number
		/** External hover state - if provided, component is controlled */
		isHovering?: boolean
		/** Called when user pauses the video - receives current playback time */
		onPause?: (currentTime: number) => void
		className?: string
	}
>(function VideoThumbnailPreview(
	{
		thumbnailUrl,
		muxPlaybackId,
		title,
		thumbnailTime = 0,
		isHovering: externalHover,
		onPause,
		className,
	},
	ref,
) {
	const playerRef = React.useRef<MuxPlayerRefAttributes | null>(null)
	const isControlled = externalHover !== undefined
	const [internalHover, setInternalHover] = React.useState(false)
	const [shouldShowVideo, setShouldShowVideo] = React.useState(false)
	const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

	const isHovering = isControlled ? externalHover : internalHover

	// Expose getCurrentTime to parent
	React.useImperativeHandle(ref, () => ({
		getCurrentTime: () => playerRef.current?.currentTime ?? thumbnailTime,
	}))

	// Handle external hover changes
	React.useEffect(() => {
		if (!isControlled) return

		if (externalHover) {
			hoverTimeoutRef.current = setTimeout(() => {
				setShouldShowVideo(true)
			}, 300)
		} else {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
				hoverTimeoutRef.current = null
			}
			setTimeout(() => {
				setShouldShowVideo(false)
			}, 500)
		}
	}, [externalHover, isControlled])

	const handleMouseEnter = React.useCallback(() => {
		if (isControlled) return
		hoverTimeoutRef.current = setTimeout(() => {
			setInternalHover(true)
			setShouldShowVideo(true)
		}, 300)
	}, [isControlled])

	const handleMouseLeave = React.useCallback(() => {
		if (isControlled) return
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current)
			hoverTimeoutRef.current = null
		}
		setInternalHover(false)
		setTimeout(() => {
			setShouldShowVideo(false)
		}, 500)
	}, [isControlled])

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
			}
		}
	}, [])

	return (
		<div
			className={cn('relative h-full w-full', className)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Static thumbnail - stays visible until video is ready */}
			<Image
				loading="lazy"
				src={thumbnailUrl}
				alt={title}
				fill
				className={cn(
					'object-cover transition-opacity duration-300',
					shouldShowVideo ? 'pointer-events-none opacity-0' : 'opacity-100',
				)}
			/>

			{/* Mux player - only mounted when needed */}
			{shouldShowVideo && (
				<div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
					<MuxPlayer
						ref={playerRef}
						playbackId={muxPlaybackId}
						accentColor="#DD9637"
						autoPlay="true"
						loop
						onPause={() => {
							const currentTime = playerRef.current?.currentTime ?? 0
							onPause?.(currentTime)
						}}
						startTime={thumbnailTime}
						streamType="on-demand"
						preload="auto"
						className="absolute inset-0 h-full w-full"
						style={
							{
								// '--controls': 'none',
								'--media-object-fit': 'cover',
								// hide play or pause buttons in the center
								'--play-button': 'none',
								'--pause-button': 'none',
								aspectRatio: 'unset',
							} as React.CSSProperties
						}
						metadata={{
							video_title: title,
						}}
					/>
				</div>
			)}

			{/* Play icon overlay */}
			<div
				className={cn(
					'bg-foreground text-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-2 transition-all duration-300',
					shouldShowVideo
						? 'scale-0 opacity-0 blur-lg'
						: 'scale-100 opacity-100 blur-none group-hover:scale-110',
				)}
			>
				<svg
					className="relative size-5 translate-x-0.5"
					xmlns="http://www.w3.org/2000/svg"
					width="8"
					height="10"
					fill="none"
					viewBox="0 0 8 10"
				>
					<path fill="currentColor" d="M.75 8.75v-8l6.5 4-6.5 4Z" />
				</svg>
			</div>
		</div>
	)
})
