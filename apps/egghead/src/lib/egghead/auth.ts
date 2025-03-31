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

	const profile = await fetch(eggheadUserUrl, {
		headers: {
			Authorization: `Bearer ${eggheadToken}`,
			'User-Agent': 'authjs',
		},
	}).then(async (res) => {
		if (!res.ok) {
			throw new EggheadApiError(res.statusText, res.status)
		}
		return await res.json()
	})

	const parsedProfile = EggheadCurrentUserSchema.safeParse(profile)

	if (!parsedProfile.success) {
		throw new Error('Failed to parse egghead profile', {
			cause: parsedProfile.error.flatten().fieldErrors,
		})
	}

	return parsedProfile.data
}
