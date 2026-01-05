'use client'
export {
	AmplitudeProvider,
	useAmplitude,
	type AmplitudeProviderProps,
	type AmplitudeContextType,
} from '@coursebuilder/next/providers'

// Re-export AmplitudeProvider as AmplitudeContextProvider for backward compatibility
export { AmplitudeProvider as AmplitudeContextProvider } from '@coursebuilder/next/providers'

// Default export for backward compatibility with existing imports
export { AmplitudeProvider as default } from '@coursebuilder/next/providers'
