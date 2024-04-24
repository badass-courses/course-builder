import * as React from 'react'
import cookies from '@/utils/cookies'
import { type MuxPlayerRefAttributes } from '@mux/mux-player-react'

const MUX_PLAYER_PREFS_KEY = 'muxplayer-react-prefs'

export const defaultSubtitlePreference = {
	id: null,
	kind: null,
	label: null,
	language: null,
	mode: 'disabled',
}

export type Subtitle = {
	id: string | null
	kind: string | null
	label: string | null
	language: string | null
	mode: string
}

export type PlayerPrefs = {
	volume: number
	playbackRate: number
	autoplay: boolean
	videoQuality: {
		bitrate: any
		height: any
		id: string
		width: any
	}
	subtitle: Subtitle
	muted: boolean
	theater: boolean
	defaultView: string
	activeSidebarTab: number
}

const defaultPlayerPreferences: PlayerPrefs = {
	volume: 1,
	playbackRate: 1,
	autoplay: false,
	videoQuality: {
		bitrate: null,
		height: null,
		id: 'auto',
		width: null,
	},
	subtitle: defaultSubtitlePreference,
	muted: false,
	theater: false,
	defaultView: 'transcript',
	activeSidebarTab: 0,
}

export const getPlayerPrefs = () => {
	if (typeof window === 'undefined') {
		return defaultPlayerPreferences
	}
	return (
		cookies.get(MUX_PLAYER_PREFS_KEY) ||
		cookies.set(MUX_PLAYER_PREFS_KEY, defaultPlayerPreferences)
	)
}

export const savePlayerPrefs = (options: any) => {
	return cookies.set(
		MUX_PLAYER_PREFS_KEY,
		{
			...defaultPlayerPreferences,
			...getPlayerPrefs(),
			...options,
		},
		{ sameSite: 'None', secure: true },
	)
}

export const useMuxPlayerPrefs = () => {
	const [playerPrefs, setPlayerPrefs] =
		React.useState<PlayerPrefs>(getPlayerPrefs())

	const setPlayerPrefsOptions = React.useCallback((options: any) => {
		console.debug('setting player prefs', { options })
		const newPrefs = savePlayerPrefs(options)
		setPlayerPrefs(newPrefs)
	}, [])

	return {
		setPlayerPrefs: setPlayerPrefsOptions,
		getPlayerPrefs: React.useCallback(getPlayerPrefs, []),
		...playerPrefs,
	}
}

export const setPreferredTextTrack = (
	muxPlayerRef: React.RefObject<MuxPlayerRefAttributes>,
) => {
	if (muxPlayerRef.current) {
		let player = muxPlayerRef.current
		let preferredTextTrack = player.textTracks?.getTrackById(
			getPlayerPrefs().subtitle.id,
		)
		if (preferredTextTrack && getPlayerPrefs().subtitle.mode === 'showing') {
			preferredTextTrack.mode = 'showing'
		}
	}
}

export const handleTextTrackChange = (
	muxPlayerRef: React.RefObject<MuxPlayerRefAttributes>,
	setPlayerPrefs: (e: { subtitle: Subtitle }) => void,
) => {
	if (muxPlayerRef.current) {
		let player = muxPlayerRef.current
		player?.textTracks?.addEventListener('change', () => {
			const subtitles = Array.from(player.textTracks || []).filter((track) => {
				return ['subtitles'].includes(track.kind)
			})

			subtitles.forEach((textTrack) => {
				setPlayerPrefs({
					subtitle: {
						id: textTrack.id,
						kind: textTrack.kind,
						label: textTrack.label,
						language: textTrack.language,
						mode: textTrack.mode,
					},
				})
			})
		})
	}
}
