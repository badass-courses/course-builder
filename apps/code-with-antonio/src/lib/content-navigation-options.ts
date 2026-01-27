/**
 * Depth of nested resources to include in content navigation.
 */
export type ContentNavigationDepth = 1 | 2 | 3

/**
 * Caller identifier for content navigation requests.
 */
export type ContentNavigationCaller = string

/**
 * Options for content navigation queries.
 */
export type ContentNavigationOptions = {
	caller?: ContentNavigationCaller
	depth?: ContentNavigationDepth
	debug?: boolean
}

type NormalizedContentNavigationOptions = {
	caller?: ContentNavigationCaller
	depth: ContentNavigationDepth
	debug: boolean
}

/**
 * Normalizes content navigation options to stable defaults.
 */
export const normalizeContentNavigationOptions = (
	options?: ContentNavigationOptions,
): NormalizedContentNavigationOptions => {
	const depth =
		options?.depth === 1 || options?.depth === 2 || options?.depth === 3
			? options.depth
			: 3

	return {
		caller: options?.caller ?? undefined,
		depth,
		debug: options?.debug ?? false,
	}
}

/**
 * Builds a stable cache key for content navigation requests.
 */
export const getContentNavigationCacheKey = (
	slugOrId: string,
	options: NormalizedContentNavigationOptions,
) => {
	const caller = options.caller ?? 'unknown'
	return `${slugOrId}:${options.depth}:${caller}`
}
