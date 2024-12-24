/**
 * Type guard for empty values (null, undefined, empty arrays, empty objects, empty strings)
 */
export function isEmpty(value: unknown): boolean {
	if (value == null) return true
	if (typeof value === 'string') return value.trim().length === 0
	if (Array.isArray(value)) return value.length === 0
	if (value instanceof Map || value instanceof Set) return value.size === 0
	if (typeof value === 'object') return Object.keys(value).length === 0

	return false
}

/**
 * Type guard for non-empty values
 */
export function isNotEmpty<T>(value: T | null | undefined): value is T {
	return !isEmpty(value)
}
