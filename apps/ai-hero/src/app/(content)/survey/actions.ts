'use server'

import { cookies } from 'next/headers'

function deepOmitNull(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(deepOmitNull).filter((x) => x !== null)
	}

	if (obj && typeof obj === 'object') {
		return Object.entries(obj).reduce(
			(acc, [key, value]) => {
				const cleaned = deepOmitNull(value)
				if (cleaned !== null) {
					acc[key] = cleaned
				}
				return acc
			},
			{} as Record<string, any>,
		)
	}

	return obj === null ? undefined : obj
}

/**
 * Sets the subscriber cookies after a successful survey submission
 */
export async function setSubscriberCookie(subscriber: {
	id: number | string
	[key: string]: any
}) {
	const cookieStore = await cookies()

	cookieStore.set('ck_subscriber', JSON.stringify(deepOmitNull(subscriber)), {
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 31556952, // 1 year
	})

	cookieStore.set('ck_subscriber_id', JSON.stringify(subscriber.id), {
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 31556952, // 1 year
	})
}
