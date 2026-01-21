'use client'

import { useEffect, useRef } from 'react'
import { setSubscriberCookie } from '@/lib/subscribe-actions'

/**
 * Client component that sets the subscriber cookie on mount.
 * Must be a client component because cookies can only be modified
 * via Server Actions called from the client.
 */
export function SetSubscriberCookie({ email }: { email: string }) {
	const hasSet = useRef(false)

	useEffect(() => {
		if (email && !hasSet.current) {
			hasSet.current = true
			setSubscriberCookie(email)
		}
	}, [email])

	return null
}
