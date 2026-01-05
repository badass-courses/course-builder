'use client'

import * as React from 'react'
import { env } from '@/env.mjs'

import {
	AmplitudeProvider,
	useAmplitude,
	type AmplitudeContextType,
	type AmplitudeProviderProps,
} from '@coursebuilder/next/providers'

// Re-export types and hooks from shared package
export { useAmplitude, type AmplitudeProviderProps, type AmplitudeContextType }

// Re-export the configurable provider
export { AmplitudeProvider }

/**
 * Backward-compatible wrapper that reads API key from environment.
 * Use this for zero-config setup in this application.
 */
export const AmplitudeContextProvider: React.FC<{
	children: React.ReactNode
}> = ({ children }) => {
	return (
		<AmplitudeProvider apiKey={env.NEXT_PUBLIC_AMPLITUDE_API_KEY}>
			{children}
		</AmplitudeProvider>
	)
}

export default AmplitudeContextProvider
