'use client'

import * as React from 'react'
import { createContext, useEffect } from 'react'
import { env } from '@/env.mjs'
import { init, track } from '@amplitude/analytics-browser'

export const AmplitudeContext = createContext({})

const AmplitudeContextProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	useEffect(() => {
		if (env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
			init(env.NEXT_PUBLIC_AMPLITUDE_API_KEY, undefined, {
				defaultTracking: {
					sessions: true,
				},
			})
		}
	}, [])

	const trackAmplitudeEvent = (
		eventName: string,
		eventProperties: Record<string, any>,
	) => {
		if (env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
			track(eventName, eventProperties)
		}
	}

	const value = { trackAmplitudeEvent }

	return (
		<AmplitudeContext.Provider value={value}>
			{children}
		</AmplitudeContext.Provider>
	)
}

export default AmplitudeContextProvider
