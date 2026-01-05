'use client'

// Theme Provider
export { ThemeProvider, type ThemeProviderProps } from './theme-provider.js'

// Amplitude Analytics Provider
export {
	AmplitudeProvider,
	useAmplitude,
	type AmplitudeProviderProps,
	type AmplitudeContextType,
} from './amplitude-provider.js'
export { default as AmplitudeContextProvider } from './amplitude-provider.js'

// Mux Player Provider
export {
	MuxPlayerProvider,
	useMuxPlayer,
	defaultPlayerPreferences,
	defaultSubtitlePreference,
	getPlayerPrefs,
	savePlayerPrefs,
	MUX_PLAYER_PREFS_KEY,
	type MuxPlayerProviderProps,
	type PlayerPrefs,
	type Subtitle,
} from './mux-player/index.js'
