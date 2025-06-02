'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
	defaultSubtitlePreference,
	type Subtitle,
} from '@/lib/mux-player-prefs'
import MuxPlayer, { type MuxPlayerRefAttributes } from '@mux/mux-player-react'

import { type VideoResource } from '@coursebuilder/core/schemas'

const KEY = 'muxplayer-react-prefs'

// Embed-friendly player preferences using sessionStorage as fallback
type EmbedPlayerPrefs = {
	volume: number
	playbackRate: number
	subtitle: Subtitle
}

const defaultEmbedPrefs: EmbedPlayerPrefs = {
	volume: 1,
	playbackRate: 1,
	subtitle: defaultSubtitlePreference,
}

const getEmbedPlayerPrefs = (): EmbedPlayerPrefs => {
	if (typeof window === 'undefined') return defaultEmbedPrefs

	try {
		// Try localStorage first, fallback to sessionStorage for cross-origin
		const stored = localStorage.getItem(KEY) || sessionStorage.getItem(KEY)
		return stored ? JSON.parse(stored) : defaultEmbedPrefs
	} catch {
		return defaultEmbedPrefs
	}
}

const saveEmbedPlayerPrefs = (prefs: Partial<EmbedPlayerPrefs>) => {
	if (typeof window === 'undefined') return

	const newPrefs = { ...getEmbedPlayerPrefs(), ...prefs }
	try {
		// Try localStorage first, fallback to sessionStorage
		localStorage.setItem(KEY, JSON.stringify(newPrefs))
	} catch {
		try {
			sessionStorage.setItem(KEY, JSON.stringify(newPrefs))
		} catch {
			// Storage blocked, continue without persistence
		}
	}
}

export function EmbedPlayer({
	playbackId,
	videoDetails,
	postTitle,
	thumbnailTime,
}: {
	playbackId: string
	videoDetails: VideoResource
	postTitle: string
	thumbnailTime: number
}) {
	const playerRef = useRef<MuxPlayerRefAttributes>(null)
	const [prefs, setPrefs] = useState<EmbedPlayerPrefs>(defaultEmbedPrefs)

	useEffect(() => {
		setPrefs(getEmbedPlayerPrefs())
	}, [])

	// Text tracks event listener management
	useEffect(() => {
		const handleTextTracksChange = () => {
			if (!playerRef.current?.textTracks) return

			const tracks = Array.from(playerRef.current.textTracks)
			const activeTrack = tracks.find((track) => track.mode === 'showing')

			if (activeTrack) {
				const subtitle: Subtitle = {
					id: activeTrack.id,
					kind: activeTrack.kind,
					label: activeTrack.label,
					language: activeTrack.language,
					mode: activeTrack.mode,
				}
				setPrefs((prev) => ({ ...prev, subtitle }))
				saveEmbedPlayerPrefs({ subtitle })
			} else {
				// No active track
				const subtitle: Subtitle = {
					...defaultSubtitlePreference,
					mode: 'disabled',
				}
				setPrefs((prev) => ({ ...prev, subtitle }))
				saveEmbedPlayerPrefs({ subtitle })
			}
		}

		const setupTextTracksListener = () => {
			if (playerRef.current?.textTracks) {
				playerRef.current.textTracks.addEventListener(
					'change',
					handleTextTracksChange,
				)
				return () => {
					if (playerRef.current?.textTracks) {
						playerRef.current.textTracks.removeEventListener(
							'change',
							handleTextTracksChange,
						)
					}
				}
			}
			return undefined
		}

		// Set up listener when player is loaded
		const cleanup = setupTextTracksListener()

		// Return cleanup function
		return cleanup
	}, []) // Empty dependency array since we want this to run once

	const handleRateChange = (evt: Event) => {
		const target = evt.target as HTMLVideoElement
		const value = target.playbackRate || 1
		setPrefs((prev) => ({ ...prev, playbackRate: value }))
		saveEmbedPlayerPrefs({ playbackRate: value })
	}

	const handleVolumeChange = (evt: Event) => {
		const target = evt.target as HTMLVideoElement
		const value = target.volume || 1
		setPrefs((prev) => ({ ...prev, volume: value }))
		saveEmbedPlayerPrefs({ volume: value })
	}

	const handleLoadedData = () => {
		// Text tracks listener is now managed by useEffect above
		// This is just here for any future loaded data handling
	}

	return (
		<div
			className="h-full w-full overflow-hidden"
			style={{
				margin: 0,
				padding: 0,
				position: 'relative',
				display: 'block',
			}}
		>
			<MuxPlayer
				ref={playerRef}
				playbackId={playbackId}
				metadata={{
					video_id: videoDetails.id,
					video_title: postTitle,
				}}
				className="h-full w-full"
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					margin: 0,
					padding: 0,
				}}
				streamType="on-demand"
				accentColor="#926FDD"
				playbackRates={[0.75, 1, 1.25, 1.5, 1.75, 2]}
				maxResolution="2160p"
				minResolution="540p"
				playsInline
				defaultHiddenCaptions={true}
				thumbnailTime={thumbnailTime}
				playbackRate={prefs.playbackRate}
				volume={prefs.volume}
				onRateChange={handleRateChange}
				onVolumeChange={handleVolumeChange}
				onLoadedData={handleLoadedData}
			/>
		</div>
	)
}
