'use server'

import { cookies, headers } from 'next/headers'
import { courseBuilderAdapter, db } from '@/db'
import { communicationPreferences } from '@/db/schema'
import {
	SUBSCRIBER_COOKIE_NAME,
	type SubscriberCookie,
} from '@/lib/subscriber-cookie'
import { redis } from '@/server/redis-client'
import { Ratelimit } from '@upstash/ratelimit'
import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

/**
 * Input schema for email subscription
 */
const subscribeInputSchema = z.object({
	email: z.string().email('Invalid email address'),
	firstName: z.string().optional(),
})

/**
 * Result type for subscription actions
 */
export type SubscribeResult =
	| { success: true; isNewSubscriber: boolean; email: string }
	| { success: false; error: string }

/**
 * Subscribe an email address to the newsletter by storing it in the database.
 * Creates a user (if needed) and sets up their newsletter communication preference.
 *
 * @param input - Object containing email and optional firstName
 * @returns Result indicating success or failure with relevant data
 */
export async function subscribeToNewsletter(
	input: z.infer<typeof subscribeInputSchema>,
): Promise<SubscribeResult> {
	try {
		const validated = subscribeInputSchema.parse(input)

		// Rate limit: 5 subscribe attempts per hour per IP
		const headersList = await headers()
		const ip = headersList.get('x-forwarded-for') || 'unknown'
		const ratelimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(5, '1 h'),
		})
		const { success: withinLimit } = await ratelimit.limit(
			`subscribe_${ip}`,
		)
		if (!withinLimit) {
			return {
				success: false,
				error: 'Too many attempts. Please try again later.',
			}
		}

		// Find or create the user
		const { user, isNewUser } = await courseBuilderAdapter.findOrCreateUser(
			validated.email,
			validated.firstName,
		)

		if (!user) {
			return { success: false, error: 'Failed to create subscriber' }
		}

		// Look up the Newsletter preference type and Email channel
		const preferenceType =
			await db.query.communicationPreferenceTypes.findFirst({
				where: (cpt, { eq }) => eq(cpt.name, 'Newsletter'),
			})

		const preferenceChannel = await db.query.communicationChannel.findFirst({
			where: (cc, { eq }) => eq(cc.name, 'Email'),
		})

		if (!preferenceType || !preferenceChannel) {
			console.warn(
				'Communication preference type or channel not found. Run db:seed to set up.',
			)
			return {
				success: true,
				isNewSubscriber: isNewUser,
				email: user.email,
			}
		}

		// Check if user already has this preference
		const existingPreference =
			await db.query.communicationPreferences.findFirst({
				where: (cp, { eq, and }) =>
					and(
						eq(cp.userId, user.id),
						eq(cp.preferenceTypeId, preferenceType.id),
						eq(cp.channelId, preferenceChannel.id),
					),
			})

		if (existingPreference) {
			// Reactivate if previously opted out
			if (!existingPreference.active || existingPreference.optOutAt) {
				await db
					.update(communicationPreferences)
					.set({
						active: true,
						optInAt: new Date(),
						optOutAt: null,
						updatedAt: new Date(),
					})
					.where(eq(communicationPreferences.id, existingPreference.id))
			}
			return {
				success: true,
				isNewSubscriber: false,
				email: user.email,
			}
		}

		// Create new communication preference
		await db.insert(communicationPreferences).values({
			id: nanoid(),
			userId: user.id,
			preferenceTypeId: preferenceType.id,
			channelId: preferenceChannel.id,
			active: true,
			optInAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		return {
			success: true,
			isNewSubscriber: isNewUser,
			email: user.email,
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.errors[0]?.message || 'Invalid input',
			}
		}
		console.error('Error subscribing to newsletter:', error)
		return {
			success: false,
			error: 'An unexpected error occurred. Please try again.',
		}
	}
}

/**
 * Set a cookie to remember the subscriber.
 *
 * @param email - The subscriber's email address
 */
export async function setSubscriberCookie(email: string): Promise<void> {
	const cookieStore = await cookies()

	const subscriberData: SubscriberCookie = {
		email,
		subscribedAt: new Date().toISOString(),
	}

	cookieStore.set(SUBSCRIBER_COOKIE_NAME, JSON.stringify(subscriberData), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365, // 1 year
		path: '/',
	})
}

/**
 * Get the subscriber from cookie.
 * Returns null if not subscribed or cookie is invalid.
 */
export async function getSubscriberFromCookie(): Promise<SubscriberCookie | null> {
	const cookieStore = await cookies()
	const cookie = cookieStore.get(SUBSCRIBER_COOKIE_NAME)?.value

	if (!cookie || cookie === 'undefined') {
		return null
	}

	try {
		const data = JSON.parse(cookie) as SubscriberCookie
		if (!data.email) {
			return null
		}
		return data
	} catch {
		return null
	}
}

/**
 * Check if the current visitor is subscribed (via cookie).
 */
export async function isSubscribed(): Promise<boolean> {
	const subscriber = await getSubscriberFromCookie()
	return subscriber !== null
}
