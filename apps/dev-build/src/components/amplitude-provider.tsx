'use client'
export {
	AmplitudeProvider,
	useAmplitude,
	type AmplitudeProviderProps,
	type AmplitudeContextType,
} from '@coursebuilder/next/providers'

// Re-export AmplitudeProvider as both named export AmplitudeContextProvider and default
// to maintain backward compatibility with existing imports
export { AmplitudeProvider as AmplitudeContextProvider } from '@coursebuilder/next/providers'
export { AmplitudeProvider as default } from '@coursebuilder/next/providers'
