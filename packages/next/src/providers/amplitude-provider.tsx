'use client'

import * as React from 'react'
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from 'react'
import { init, setUserId, track } from '@amplitude/analytics-browser'
import { useSession } from 'next-auth/react'

export type AmplitudeContextType = {
	trackAmplitudeEvent: (
		eventName: string,
		eventProperties?: Record<string, any>,
	) => void
}

const AmplitudeContext = createContext<AmplitudeContextType>({
	trackAmplitudeEvent: () => {},
})

export type AmplitudeProviderProps = {
	children: React.ReactNode
	/** Amplitude API key. If not provided, tracking is disabled. */
	apiKey?: string
	/** Default tracking configuration */
	defaultTracking?: {
		sessions?: boolean
		pageViews?: boolean
		formInteractions?: boolean
		fileDownloads?: boolean
	}
}

/**
 * Amplitude analytics provider.
 * Automatically tracks sessions and identifies users when authenticated.
 *
 * @example
 * ```tsx
 * <AmplitudeProvider apiKey={process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY}>
 *   <App />
 * </AmplitudeProvider>
 * ```
 */
export function AmplitudeProvider({
	children,
	apiKey,
	defaultTracking = { sessions: true },
}: AmplitudeProviderProps) {
	const { data: session, status } = useSession()
	const userEmail = session?.user?.email

	useEffect(() => {
		if (apiKey) {
			init(apiKey, userEmail ?? undefined, { defaultTracking })
		}
	}, [apiKey, userEmail, defaultTracking])

	useEffect(() => {
		if (apiKey && status === 'authenticated') {
			setUserId(userEmail ?? undefined)
		}
	}, [apiKey, status, userEmail])

	const trackAmplitudeEvent = useCallback(
		(eventName: string, eventProperties: Record<string, any> = {}) => {
			if (apiKey) {
				track(eventName, eventProperties)
			}
		},
		[apiKey],
	)

	const value = useMemo(() => ({ trackAmplitudeEvent }), [trackAmplitudeEvent])

	return (
		<AmplitudeContext.Provider value={value}>
			{children}
		</AmplitudeContext.Provider>
	)
}

/**
 * Hook to access Amplitude tracking functionality.
 *
 * @example
 * ```tsx
 * const { trackAmplitudeEvent } = useAmplitude()
 * trackAmplitudeEvent('button_clicked', { buttonId: 'signup' })
 * ```
 */
export function useAmplitude() {
	return useContext(AmplitudeContext)
}

// Default export for backward compatibility
export default AmplitudeProvider
