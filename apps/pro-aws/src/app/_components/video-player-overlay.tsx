'use client'

import React from 'react'

import { Button } from '@coursebuilder/ui'
import { useVideoPlayerOverlay } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import type { FinishedAction } from '@coursebuilder/ui/hooks/use-video-player-overlay'

export const FinishedLessonOverlay: React.FC<{
	action: FinishedAction
}> = ({ action }) => {
	const { playerRef } = action

	return (
		<div className="bg-background/80 absolute left-0 top-0 z-50 flex aspect-video h-full w-full items-center justify-center text-lg backdrop-blur-md">
			Video ended
			<Button
				type="button"
				onClick={() => {
					if (playerRef.current) {
						playerRef.current.play()
					}
				}}
			>
				Replay
			</Button>
		</div>
	)
}

const VideoPlayerOverlay: React.FC = () => {
	const { state: overlayState, dispatch } = useVideoPlayerOverlay()

	switch (overlayState.action?.type) {
		case 'LESSON_FINISHED':
			return <FinishedLessonOverlay action={overlayState.action} />
		// TODO: Add more overlays here, e.g. for 'COLLECTION_FINISHED'
		case 'HIDDEN':
			return null
		default:
			return null
	}
}

export default VideoPlayerOverlay
