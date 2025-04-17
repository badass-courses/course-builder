import cookies from '@/utils/cookies'

export const MUX_PLAYER_PREFS_KEY = 'muxplayer-react-prefs'

export const defaultSubtitlePreference = {
	id: null,
	kind: null,
	label: null,
	language: null,
	mode: 'disabled',
} as const

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
}

export const defaultPlayerPreferences: PlayerPrefs = {
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
}

export const getPlayerPrefs = (): PlayerPrefs => {
	if (typeof window === 'undefined') {
		return defaultPlayerPreferences
	}
	return (
		cookies.get(MUX_PLAYER_PREFS_KEY) ||
		cookies.set(MUX_PLAYER_PREFS_KEY, defaultPlayerPreferences)
	)
}

export const savePlayerPrefs = (options: Partial<PlayerPrefs>): PlayerPrefs => {
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
