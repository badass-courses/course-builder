'use server'

import { cookies } from 'next/headers'
import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { SubscriberSchema } from '@/schemas/subscriber'

/**
 * Sets the subscriber cookies after a successful survey submission or subscriber fetch
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

/**
 * Sets the ck_subscriber_id cookie from a URL parameter
 * Used when users click email links with ?ck_subscriber_id=X
 */
export async function setSubscriberIdFromUrl(subscriberId: string) {
	const cookieStore = await cookies()

	cookieStore.set('ck_subscriber_id', subscriberId, {
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 31556952, // 1 year
	})
}

/**
 * Gets the subscriber from cookies, fetching from ConvertKit if needed
 */
export async function getSubscriberFromCookie() {
	const cookieStore = await cookies()
	if (!cookieStore) return null

	const cookie = cookieStore.get('ck_subscriber')?.value
	const subscriberIdCookie = cookieStore.get('ck_subscriber_id')?.value

	// If we have the full subscriber cookie, use that
	if (cookie && cookie !== 'undefined') {
		try {
			const subscriber = JSON.parse(cookie)
			if (subscriber?.id && !subscriber.email_address) {
				return SubscriberSchema.parse(
					await emailListProvider.getSubscriber(subscriber.id.toString()),
				)
			}
			if (!subscriber?.id) throw new Error('no subscriber id')
			return SubscriberSchema.parse(subscriber)
		} catch (e) {
			return null
		}
	}

	// If we only have the ID (from URL param), fetch and populate full subscriber
	if (subscriberIdCookie) {
		try {
			const subscriber =
				await emailListProvider.getSubscriber(subscriberIdCookie)
			if (subscriber) {
				// Populate the full ck_subscriber cookie for future requests
				await setSubscriberCookie(subscriber)
				return SubscriberSchema.parse(subscriber)
			}
		} catch (e) {
			return null
		}
	}

	return null
}

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
