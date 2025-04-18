'use client'

import * as React from 'react'
import { createContext, useEffect } from 'react'
import { env } from '@/env.mjs'
import { init, setUserId, track } from '@amplitude/analytics-browser'
import { useSession } from 'next-auth/react'

export const AmplitudeContext = createContext({})

const AmplitudeContextProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const { data: session, status } = useSession()

	const userEmail = session?.user?.email

	useEffect(() => {
		if (env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
			init(
				env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
				userEmail ? userEmail : undefined,
				{
					defaultTracking: {
						sessions: true,
					},
				},
			)
		}
	}, [userEmail])

	useEffect(() => {
		if (env.NEXT_PUBLIC_AMPLITUDE_API_KEY && status === 'authenticated') {
			setUserId(userEmail ? userEmail : undefined)
		}
	}, [userEmail])

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
