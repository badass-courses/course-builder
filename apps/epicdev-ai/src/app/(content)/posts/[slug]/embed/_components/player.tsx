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
	const textTracksListenerRef = useRef<(() => void) | null>(null)

	useEffect(() => {
		setPrefs(getEmbedPlayerPrefs())
	}, [])

	// Cleanup text tracks listener on unmount
	useEffect(() => {
		return () => {
			if (textTracksListenerRef.current) {
				textTracksListenerRef.current()
				textTracksListenerRef.current = null
			}
		}
	}, [])

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

	const restoreSubtitlePreferences = () => {
		if (!playerRef.current?.textTracks) return

		// Read directly from storage instead of relying on state
		const storedPrefs = getEmbedPlayerPrefs()
		const savedSubtitle = storedPrefs.subtitle

		console.log('Restoring subtitle preferences:', savedSubtitle)

		if (savedSubtitle.mode === 'showing') {
			// Find the matching track and enable it
			const tracks = Array.from(playerRef.current.textTracks)
			console.log(
				'Available tracks:',
				tracks.map((t) => ({ id: t.id, language: t.language, label: t.label })),
			)

			const targetTrack = tracks.find((track) => {
				// Try multiple matching strategies
				return (
					track.id === savedSubtitle.id ||
					track.language === savedSubtitle.language ||
					track.label === savedSubtitle.label
				)
			})

			console.log('Target track found:', targetTrack)

			if (targetTrack) {
				// Disable all tracks first
				tracks.forEach((track) => (track.mode = 'disabled'))
				// Enable the target track
				targetTrack.mode = 'showing'
				console.log(
					'Enabled subtitle track:',
					targetTrack.label || targetTrack.language,
				)
			}
		}
	}

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
			console.log('Saving subtitle preference:', subtitle)
			setPrefs((prev) => ({ ...prev, subtitle }))
			saveEmbedPlayerPrefs({ subtitle })
		} else {
			// No active track
			const subtitle: Subtitle = {
				...defaultSubtitlePreference,
				mode: 'disabled',
			}
			console.log('Saving disabled subtitle preference')
			setPrefs((prev) => ({ ...prev, subtitle }))
			saveEmbedPlayerPrefs({ subtitle })
		}
	}

	const handleLoadedData = () => {
		// Clean up any existing listener
		if (textTracksListenerRef.current) {
			textTracksListenerRef.current()
		}

		// Set up text tracks listener first
		if (playerRef.current?.textTracks) {
			playerRef.current.textTracks.addEventListener(
				'change',
				handleTextTracksChange,
			)

			// Store cleanup function
			textTracksListenerRef.current = () => {
				if (playerRef.current?.textTracks) {
					playerRef.current.textTracks.removeEventListener(
						'change',
						handleTextTracksChange,
					)
				}
			}
		}

		// Delay subtitle restoration to ensure tracks are fully loaded
		setTimeout(() => {
			restoreSubtitlePreferences()
		}, 100)
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
				preferPlayback="mse"
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
