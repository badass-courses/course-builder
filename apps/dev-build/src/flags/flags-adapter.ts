import { redis } from '@/server/redis-client'
import type { Adapter } from '@vercel/flags'

import { env } from '../env.mjs'
import { FLAG_PREFIX } from './flags'
import { getEnvironment } from './flags-env'

export const getFlagKey = (key: string): string => {
	const env = getEnvironment()
	return `${FLAG_PREFIX}${env}:${key}`
}

function createRedisAdapter(): Adapter<boolean, any> {
	return {
		origin(key: string) {
			return `${env.COURSEBUILDER_URL}/admin/flags/${key}`
		},
		async decide({ key }: { key: string }): Promise<boolean> {
			// Strip environment prefix if present since getFlagKey will add it
			const [, baseKey = key] = key.split(':')
			const redisKey = getFlagKey(baseKey)
			const value = await redis.get(redisKey)

			// Handle both string and boolean values
			return value === true || value === 'true' || value === '1'
		},
	}
}

/**
 * A default Redis adapter that can be used directly
 */
export function redisAdapter(): Adapter<boolean, any> {
	return createRedisAdapter()
}
