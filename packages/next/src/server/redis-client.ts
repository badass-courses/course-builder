import { Redis } from '@upstash/redis'

/**
 * Creates a Redis client from environment variables.
 * Expects UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 *
 * @returns Redis client instance
 *
 * @example
 * ```ts
 * import { createRedisClient } from '@coursebuilder/next/server'
 *
 * export const redis = createRedisClient()
 * ```
 */
export function createRedisClient(): Redis {
	return Redis.fromEnv()
}

// Re-export Redis type for convenience
export { Redis }
