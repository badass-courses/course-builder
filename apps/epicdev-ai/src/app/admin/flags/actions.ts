'use server'

import { revalidatePath } from 'next/cache'
import { FLAG_PREFIX, FLAGS, getEnvironment } from '@/flags'
import { getFlagKey } from '@/flags/flags-adapter'
import { auth, getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { redis } from '@/server/redis-client'

export async function toggleFlag(key: string, value: boolean) {
	console.log(`[toggleFlag] Starting toggle for ${key} to ${value}`)

	const { session, ability } = await getServerAuthSession()
	if (!session?.user) {
		console.error('[toggleFlag] Unauthorized: No user ID')
		throw new Error('Unauthorized')
	}

	if (!ability.can('manage', 'all')) {
		console.error('[toggleFlag] Unauthorized')
		throw new Error('Unauthorized')
	}

	const flag = FLAGS[key as keyof typeof FLAGS]
	if (!flag) {
		console.error(`[toggleFlag] Invalid flag key: ${key}`)
		throw new Error('Invalid flag key')
	}

	if (typeof value !== 'boolean') {
		console.error(`[toggleFlag] Invalid value type: ${typeof value}`)
		throw new Error('Value must be a boolean')
	}

	const redisKey = getFlagKey(key)
	console.log(`[toggleFlag] Redis key: ${redisKey}`)

	try {
		const previousValue = await redis.get(redisKey)
		console.log(`[toggleFlag] Previous value: ${previousValue}`)

		await redis.set(redisKey, value.toString())
		console.log(`[toggleFlag] New value set: ${value}`)

		revalidatePath('/admin/flags')
		console.log('[toggleFlag] Page revalidated')

		return value
	} catch (error) {
		console.error('[toggleFlag] Error:', error)
		throw error
	}
}
