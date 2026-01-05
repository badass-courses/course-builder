'use server'

import { unstable_cache } from 'next/cache.js'

/**
 * Options for creating a cached query
 */
export interface CachedQueryOptions {
	/** Cache key prefix used as the first element in the key array */
	keyPrefix: string
	/** Cache tags for invalidation */
	tags: string[]
	/** Revalidation time in seconds (default: 3600) */
	revalidate?: number
}

/**
 * Creates a cached version of a query function using Next.js unstable_cache.
 * Provides a consistent interface for caching across the codebase.
 *
 * @example
 * ```ts
 * export const getCachedPost = createCachedQuery(
 *   async (slug: string) => getPost(slug),
 *   { keyPrefix: 'posts', tags: ['posts'] }
 * )
 * ```
 */
export function createCachedQuery<TArgs extends any[], TResult>(
	queryFn: (...args: TArgs) => Promise<TResult>,
	options: CachedQueryOptions,
): (...args: TArgs) => Promise<TResult> {
	return unstable_cache(queryFn, [options.keyPrefix], {
		revalidate: options.revalidate ?? 3600,
		tags: options.tags,
	})
}

/**
 * Type-safe wrapper for unstable_cache with additional options.
 * Use this when you need more control over the cache key generation.
 *
 * @example
 * ```ts
 * export const getCachedLesson = cacheQuery(
 *   getLesson,
 *   (slug) => [`lesson-${slug}`],
 *   { tags: ['lesson'], revalidate: 1800 }
 * )
 * ```
 */
export function cacheQuery<TArgs extends any[], TResult>(
	queryFn: (...args: TArgs) => Promise<TResult>,
	keyFn: (...args: TArgs) => string[],
	options: Omit<CachedQueryOptions, 'keyPrefix'>,
): (...args: TArgs) => Promise<TResult> {
	return ((...args: TArgs) => {
		const cacheKey = keyFn(...args)
		return unstable_cache(() => queryFn(...args), cacheKey, {
			revalidate: options.revalidate ?? 3600,
			tags: options.tags,
		})()
	}) as (...args: TArgs) => Promise<TResult>
}
