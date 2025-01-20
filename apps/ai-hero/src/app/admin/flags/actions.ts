'use server'

import { revalidatePath } from 'next/cache'
import { FLAGS, getEnvironment } from '@/lib/flags'
import { getFlagKey } from '@/lib/flags-adapter'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'

export async function toggleFlag(key: string, value: boolean) {
	const { ability, session } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	if (!session?.user) {
		throw new Error('No authenticated user')
	}

	// Validate that the flag exists in our registry
	if (!(key in FLAGS)) {
		throw new Error(`Invalid flag key: ${key}`)
	}

	// Validate the value is boolean
	if (typeof value !== 'boolean') {
		throw new Error('Flag value must be boolean')
	}

	const env = getEnvironment()
	const redisKey = getFlagKey(key)
	const user = session.user

	try {
		// Get previous value for audit log
		const previousValue = await redis.get(redisKey)

		// Use the centralized key management
		await redis.set(redisKey, value)

		// Log the change
		await log.info('feature_flag_change', {
			flag: key,
			environment: env,
			previous: previousValue,
			new: value,
			user: {
				id: user.id,
				email: user.email,
			},
			metadata: {
				name: FLAGS[key as keyof typeof FLAGS].name,
				description: FLAGS[key as keyof typeof FLAGS].description,
			},
		})

		revalidatePath('/admin/flags')
		return value
	} catch (error) {
		// Log the error
		await log.error('feature_flag_change_failed', {
			flag: key,
			environment: env,
			intended_value: value,
			error: error instanceof Error ? error.message : 'Unknown error',
			user: {
				id: user.id,
				email: user.email,
			},
		})
		throw error
	}
}
