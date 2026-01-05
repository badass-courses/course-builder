'use client'
export {
	AmplitudeProvider,
	AmplitudeContextProvider,
	useAmplitude,
	type AmplitudeProviderProps,
	type AmplitudeContextType,
} from '@coursebuilder/next/providers'

// Re-export AmplitudeContextProvider as default to maintain backward compatibility
export { AmplitudeContextProvider as default } from '@coursebuilder/next/providers'
