'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { EggheadApiError } from '@/errors/egghead-api-error'
import { eq } from 'drizzle-orm'

import { EggheadCurrentUserSchema } from './types'

/**
 * Retrieves the Egghead API access token for a user
 * @param userId - The user's ID
 * @returns The Egghead API access token
 */
export async function getEggheadToken(userId: string) {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			accounts: true,
		},
	})

	if (!user) {
		throw new Error('no-user')
	}

	const eggheadAccount = user?.accounts?.find(
		(account) => account.provider === 'egghead',
	)

	if (!eggheadAccount) {
		throw new Error('no-account')
	}

	const eggheadToken = eggheadAccount.access_token
	const eggheadExpiresAt = eggheadAccount.expires_at

	if (!eggheadToken) {
		throw new Error('no-token')
	}

	if (eggheadExpiresAt && new Date(eggheadExpiresAt * 1000) < new Date()) {
		throw new Error('token-expired')
	}

	return eggheadToken
}

/**
 * Gets the user profile from Egghead API
 * @param userId - The user's ID
 * @returns The user's Egghead profile
 */
export async function getEggheadUserProfile(userId: string) {
	const eggheadToken = await getEggheadToken(userId)
	const eggheadUserUrl = 'https://app.egghead.io/api/v1/users/current'

	const res = await fetch(eggheadUserUrl, {
		headers: {
			Authorization: `Bearer ${eggheadToken}`,
			'User-Agent': 'authjs',
		},
	})

	if (!res.ok) {
		console.error(
			JSON.stringify({
				event: 'egghead_profile_fetch_failed',
				userId,
				status: res.status,
				statusText: res.statusText,
			}),
		)
		throw new EggheadApiError(res.statusText, res.status)
	}

	const profile = await res.json()
	const parsedProfile = EggheadCurrentUserSchema.safeParse(profile)

	if (!parsedProfile.success) {
		const fieldErrors = parsedProfile.error.flatten().fieldErrors
		const issues = parsedProfile.error.issues.map((issue) => ({
			path: issue.path.join('.'),
			code: issue.code,
			message: issue.message,
			received: issue.path.reduce(
				(obj: any, key) => obj?.[key],
				profile,
			),
		}))

		console.error(
			JSON.stringify({
				event: 'egghead_profile_parse_failed',
				userId,
				eggheadUserId: profile?.id,
				fieldErrors,
				issues,
				rawKeys: Object.keys(profile ?? {}),
				instructorKeys: profile?.instructor
					? Object.keys(profile.instructor)
					: null,
			}),
		)

		throw new Error('Failed to parse egghead profile', {
			cause: fieldErrors,
		})
	}

	return parsedProfile.data
}

/**
 * Gets a user from egghead API by email
 * @param email - The user's email
 * @returns The user's egghead profile
 */
export async function getEggheadUserByEmail(email: string) {
	return await fetch(
		`https://app.egghead.io/api/v1/users/${email}?by_email=true&support=true`,
		{
			headers: {
				Authorization: `Bearer ${process.env.EGGHEAD_ADMIN_TOKEN}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
	).then(async (res) => {
		if (!res.ok) {
			console.error('Full response:', {
				status: res.status,
				statusText: res.statusText,
				headers: Object.fromEntries(res.headers.entries()),
			})
			throw new Error(
				`Failed to get egghead user: ${res.status} ${res.statusText}`,
			)
		}
		const data = await res.json()
		console.log('egghead user data', data)
		return data
	})
}

/**
 * Creates a new user in egghead API via /users/send_token
 * @param email - The user's email
 * @returns The created user's profile
 */
export async function createEggheadUser(email: string) {
	return await fetch('https://app.egghead.io/api/v1/users/send_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			email,
		}),
	}).then(async (res) => {
		if (!res.ok) {
			throw new Error(
				`Failed to create egghead user: ${res.status} ${res.statusText}`,
			)
		}
		const data = await res.json()
		if (!data) {
			throw new Error('No data returned from egghead API')
		}
		return data
	})
}
