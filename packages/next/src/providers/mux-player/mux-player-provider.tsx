'use client'

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'

import {
	defaultPlayerPreferences,
	getPlayerPrefs,
	savePlayerPrefs,
	type PlayerPrefs,
} from './mux-player-prefs.js'

type MuxPlayerContextType = {
	setMuxPlayerRef: React.Dispatch<
		React.SetStateAction<React.RefObject<MuxPlayerRefAttributes | null> | null>
	>
	muxPlayerRef: React.RefObject<MuxPlayerRefAttributes | null> | null
	playerPrefs: PlayerPrefs
	setPlayerPrefs: (options: Partial<PlayerPrefs>) => void
}

const MuxPlayerContext = createContext<MuxPlayerContextType | undefined>(
	undefined,
)

export type MuxPlayerProviderProps = {
	children: React.ReactNode
	/** Override default player preferences */
	defaultPrefs?: Partial<PlayerPrefs>
}

/**
 * Provider component that manages Mux Player state and preferences.
 * Preferences are persisted to cookies.
 *
 * @example
 * ```tsx
 * <MuxPlayerProvider defaultPrefs={{ autoplay: true }}>
 *   <App />
 * </MuxPlayerProvider>
 * ```
 */
export const MuxPlayerProvider: React.FC<MuxPlayerProviderProps> = ({
	children,
	defaultPrefs,
}) => {
	const [muxPlayerRef, setMuxPlayerRef] =
		useState<React.RefObject<MuxPlayerRefAttributes | null> | null>(null)

	// Merge default preferences with any overrides
	const mergedDefaults = useMemo(
		() => ({ ...defaultPlayerPreferences, ...defaultPrefs }),
		[defaultPrefs],
	)

	// Start with default preferences for SSR
	const [playerPrefs, setPlayerPrefsState] =
		useState<PlayerPrefs>(mergedDefaults)
	const [isInitialized, setIsInitialized] = useState(false)

	// Load preferences from cookies after mount
	useEffect(() => {
		if (!isInitialized) {
			const prefs = getPlayerPrefs()
			// Apply any default overrides to loaded prefs
			setPlayerPrefsState({ ...prefs, ...defaultPrefs })
			setIsInitialized(true)
		}
	}, [isInitialized, defaultPrefs])

	const setPlayerPrefs = useCallback((options: Partial<PlayerPrefs>) => {
		const newPrefs = savePlayerPrefs(options)
		setPlayerPrefsState(newPrefs)
	}, [])

	const value = useMemo(
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

/**
 * Hook to access Mux Player state and preferences.
 * Must be used within a MuxPlayerProvider.
 *
 * @example
 * ```tsx
 * const { playerPrefs, setPlayerPrefs, muxPlayerRef } = useMuxPlayer()
 * ```
 */
export const useMuxPlayer = () => {
	const context = useContext(MuxPlayerContext)
	if (!context) {
		throw new Error('useMuxPlayer must be used within a MuxPlayerProvider')
	}
	return context
}
