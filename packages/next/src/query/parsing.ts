import { z } from 'zod'

/**
 * Options for parsing with schema
 */
export interface ParseOptions {
	/** Whether to log errors to console (default: true) */
	logError?: boolean
	/** Custom error message for logging */
	errorMessage?: string
	/** Whether to return null on parse failure (default: true) */
	returnNull?: boolean
}

/**
 * Schema interface that supports safeParse.
 * This interface avoids TypeScript instantiation depth issues with complex Zod schemas.
 */
interface ParseableSchema<T> {
	safeParse(
		data: unknown,
	): { success: true; data: T } | { success: false; error: z.ZodError }
}

/**
 * Parses data with a Zod schema, handling errors consistently.
 * Returns null on parse failure by default.
 *
 * Note: For complex Zod schemas, provide explicit type parameter:
 * `parseWithSchema<Post>(rawPost, PostSchema, { ... })`
 *
 * @example
 * ```ts
 * const post = parseWithSchema<Post>(rawPost, PostSchema, {
 *   errorMessage: 'Error parsing post',
 * })
 * // post is Post | null
 * ```
 */
export function parseWithSchema<T>(
	data: unknown,
	schema: ParseableSchema<T>,
	options?: ParseOptions,
): T | null {
	const result = schema.safeParse(data)

	if (!result.success) {
		if (options?.logError !== false) {
			console.error(options?.errorMessage ?? 'Parse error', result.error)
		}
		if (options?.returnNull !== false) return null
		throw new Error(result.error.message)
	}

	return result.data
}

/**
 * Parses an array of data with a Zod schema.
 * Returns an empty array on parse failure.
 *
 * Note: For complex Zod schemas, provide explicit type parameter:
 * `parseArrayWithSchema<Post>(rawPosts, PostSchema, { ... })`
 *
 * @example
 * ```ts
 * const posts = parseArrayWithSchema<Post>(rawPosts, PostSchema, {
 *   errorMessage: 'Error parsing posts',
 * })
 * // posts is Post[]
 * ```
 */
export function parseArrayWithSchema<T>(
	data: unknown,
	itemSchema: ParseableSchema<T>,
	options?: ParseOptions,
): T[] {
	const arraySchema = z.array(itemSchema as z.ZodTypeAny)
	const result = arraySchema.safeParse(data)

	if (!result.success) {
		if (options?.logError !== false) {
			console.error(options?.errorMessage ?? 'Parse error', result.error)
		}
		return []
	}

	return result.data as T[]
}

/**
 * Parses data with a schema or returns a default value.
 * Useful for optional fields or fallback scenarios.
 *
 * @example
 * ```ts
 * const settings = parseOrDefault<Settings>(rawSettings, SettingsSchema, defaultSettings)
 * ```
 */
export function parseOrDefault<T>(
	data: unknown,
	schema: ParseableSchema<T>,
	defaultValue: T,
): T {
	const result = schema.safeParse(data)
	return result.success ? result.data : defaultValue
}
