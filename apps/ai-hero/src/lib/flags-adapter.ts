import { redis } from '@/server/redis-client'
import type { Adapter } from '@vercel/flags'

import { getEnvironment } from './flags'

export const FLAG_PREFIX = 'flag:'

export const getFlagKey = (key: string): string => {
	const env = getEnvironment()
	return `${FLAG_PREFIX}${env}:${key}`
}

let defaultRedisAdapter: ReturnType<typeof createRedisAdapter> | undefined

export function createRedisAdapter() {
	return function redisAdapter<ValueType, EntitiesType>(): Adapter<
		ValueType,
		EntitiesType
	> {
		return {
			origin(key: string) {
				return `/admin/flags/${key}`
			},
			async decide({ key }: { key: string }): Promise<ValueType> {
				const value = await redis.get(getFlagKey(key))
				// If no value is set, return null which will fall back to the default value
				if (value === null) return null as ValueType
				return value as ValueType
			},
		}
	}
}

/**
 * A default Redis adapter that can be used directly
 */
export function redisAdapter<ValueType, EntitiesType>(): Adapter<
	ValueType,
	EntitiesType
> {
	if (!defaultRedisAdapter) {
		defaultRedisAdapter = createRedisAdapter()
	}

	return defaultRedisAdapter<ValueType, EntitiesType>()
}
