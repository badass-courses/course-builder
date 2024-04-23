'use client'

import React, { createContext, Reducer, useContext, useReducer } from 'react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'

type VideoPlayerOverlayState = {
	action: VideoPlayerOverlayAction | null
}

export type FinishedAction = {
	type: 'LESSON_FINISHED' | 'COLLECTION_FINISHED'
	playerRef: React.RefObject<MuxPlayerRefAttributes>
}

type VideoPlayerOverlayAction =
	| FinishedAction
	| { type: 'SOFT_BLOCKED' }
	| { type: 'HARD_BLOCKED' }
	| { type: 'HIDDEN' }
	| { type: 'REPLAYED' }

const initialState: VideoPlayerOverlayState = {
	action: null,
}

const reducer: Reducer<VideoPlayerOverlayState, VideoPlayerOverlayAction> = (
	state,
	action,
) => {
	switch (action.type) {
		case 'LESSON_FINISHED':
			// TODO: Track video completion
			return {
				...state,
				action,
			}
		case 'SOFT_BLOCKED':
			return {
				...state,
				action,
			}
		case 'HARD_BLOCKED':
			return {
				...state,
				action,
			}
		case 'COLLECTION_FINISHED':
			return {
				...state,
				action,
			}
		case 'HIDDEN': {
			return {
				...state,
				action,
			}
		}
		case 'REPLAYED':
			return {
				...state,
				action,
			}
		default:
			return state
	}
}

type VideoPlayerOverlayContextType = {
	state: VideoPlayerOverlayState
	dispatch: React.Dispatch<VideoPlayerOverlayAction>
}

export const VideoPlayerOverlayProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const [state, dispatch] = useReducer(reducer, initialState)

	return (
		<VideoPlayerOverlayContext.Provider value={{ state, dispatch }}>
			{children}
		</VideoPlayerOverlayContext.Provider>
	)
}

const VideoPlayerOverlayContext = createContext<
	VideoPlayerOverlayContextType | undefined
>(undefined)

export const useVideoPlayerOverlay = () => {
	const context = useContext(VideoPlayerOverlayContext)
	if (!context) {
		throw new Error(
			'useVideoPlayerContext must be used within a VideoPlayerProvider',
		)
	}
	return {
		state: context.state,
		dispatch: context.dispatch,
	}
}
