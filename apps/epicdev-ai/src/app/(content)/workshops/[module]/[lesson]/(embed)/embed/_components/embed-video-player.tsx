'use client'

import * as React from 'react'
import type { User } from '@/ability'
import { handleSetLessonComplete } from '@/app/(content)/_components/authed-video-player'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { track } from '@/utils/analytics'
import MuxPlayer, { type MuxPlayerProps } from '@mux/mux-player-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import { cn } from '@coursebuilder/ui/utils/cn'

import { EmbedLoadingSkeleton } from './embed-loading-skeleton'

interface EmbedVideoPlayerProps {
	resource: ContentResource
	muxPlaybackId: string
	moduleSlug: string
	user: User
	className?: string
	thumbnailUrl?: string
}

/**
 * Specialized video player for iframe embedding contexts
 * Optimized for external platform integration with minimal UI
 */
export function EmbedVideoPlayer({
	resource,
	muxPlaybackId,
	moduleSlug,
	user,
	className,
	thumbnailUrl,
}: EmbedVideoPlayerProps) {
	const playerRef = React.useRef<any>(null)
	const [hasStarted, setHasStarted] = React.useState(false)
	const [isLoading, setIsLoading] = React.useState(true)
	const { moduleProgress, addLessonProgress } = useModuleProgress()
	const playerProps: MuxPlayerProps = {
		defaultHiddenCaptions: true,
		streamType: 'on-demand',
		thumbnailTime: resource.fields?.thumbnailTime || 0,
		playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
		maxResolution: '2160p',
		minResolution: '540p',
		accentColor: '#926FDD',
		onLoadStart: () => {
			setIsLoading(true)
		},
		onCanPlay: () => {
			setIsLoading(false)
		},
		onPlay: () => {
			if (!hasStarted) {
				setHasStarted(true)
				// Track embed video start
				track('started: embed video', {
					resourceSlug: resource.fields?.slug,
					resourceType: resource.type,
					moduleSlug,
					userId: user.id,
					context: 'embed',
				})
			}
		},
		onEnded: () => {
			// Track embed video completion
			track('completed: embed video', {
				resourceSlug: resource.fields?.slug,
				resourceType: resource.type,
				moduleSlug,
				userId: user.id,
				context: 'embed',
			})
			handleSetLessonComplete({
				currentResource: resource,
				moduleProgress: moduleProgress,
				addLessonProgress: addLessonProgress,
			})
		},
		// onTimeUpdate: () => {
		// 	// Optional: Track progress milestones
		// 	const currentTime = playerRef.current?.currentTime
		// 	const duration = playerRef.current?.duration

		// 	if (currentTime && duration) {
		// 		const progress = (currentTime / duration) * 100

		// 		// Track 25%, 50%, 75% milestones
		// 		if ([25, 50, 75].includes(Math.floor(progress))) {
		// 			track('progress: embed video', {
		// 				resourceSlug: resource.fields?.slug,
		// 				resourceType: resource.type,
		// 				moduleSlug,
		// 				userId: user.id,
		// 				progress: Math.floor(progress),
		// 				context: 'embed',
		// 			})
		// 		}
		// 	}
		// },
	}

	return (
		<div className={cn('relative h-full w-full bg-black', className)}>
			{isLoading && (
				<div className="absolute inset-0 z-10">
					<EmbedLoadingSkeleton thumbnailUrl={thumbnailUrl} />
				</div>
			)}
			<MuxPlayer
				preferPlayback="mse"
				ref={playerRef}
				metadata={{
					video_id: resource.id,
					video_title: resource.fields?.title || 'Lesson Video',
					viewer_user_id: user.id,
				}}
				playbackId={muxPlaybackId}
				className="h-full w-full"
				{...playerProps}
			/>
		</div>
	)
}
