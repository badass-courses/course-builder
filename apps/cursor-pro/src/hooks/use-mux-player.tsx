'use client'

import React, { createContext, useContext } from 'react'
import {
	defaultPlayerPreferences,
	getPlayerPrefs,
	savePlayerPrefs,
	type PlayerPrefs,
} from '@/lib/mux-player-prefs'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'

type MuxPlayerContextType = {
	setMuxPlayerRef: React.Dispatch<
		React.SetStateAction<React.RefObject<MuxPlayerRefAttributes | null> | null>
	>
	muxPlayerRef: React.RefObject<MuxPlayerRefAttributes | null> | null
	playerPrefs: PlayerPrefs
	setPlayerPrefs: (options: Partial<PlayerPrefs>) => void
}

/**
 * Provider component that manages Mux Player state and preferences
 */
export const MuxPlayerProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const [muxPlayerRef, setMuxPlayerRef] =
		React.useState<React.RefObject<MuxPlayerRefAttributes | null> | null>(null)

	// Start with default preferences for SSR
	const [playerPrefs, setPlayerPrefsState] = React.useState<PlayerPrefs>(
		defaultPlayerPreferences,
	)
	const [isInitialized, setIsInitialized] = React.useState(false)

	// Load preferences from cookies after mount
	React.useEffect(() => {
		if (!isInitialized) {
			const prefs = getPlayerPrefs()
			setPlayerPrefsState(prefs)
			setIsInitialized(true)
		}
	}, [isInitialized])

	const setPlayerPrefs = React.useCallback((options: Partial<PlayerPrefs>) => {
		const newPrefs = savePlayerPrefs(options)
		setPlayerPrefsState(newPrefs)
	}, [])

	const value = React.useMemo(
		() => ({
			muxPlayerRef,
			setMuxPlayerRef,
			playerPrefs,
			setPlayerPrefs,
		}),
		[muxPlayerRef, playerPrefs, setPlayerPrefs],
	)

	return (
		<MuxPlayerContext.Provider value={value}>
			{children}
		</MuxPlayerContext.Provider>
	)
}

const MuxPlayerContext = createContext<MuxPlayerContextType | undefined>(
	undefined,
)

/**
 * Hook to access Mux Player state and preferences
 * Must be used within a MuxPlayerProvider
 */
export const useMuxPlayer = () => {
	const context = useContext(MuxPlayerContext)
	if (!context) {
		throw new Error('useMuxPlayer must be used within a MuxPlayerProvider')
	}
	return context
}
