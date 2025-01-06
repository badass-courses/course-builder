/**
 * Type guard for string values
 */
export function isString(value: unknown): value is string {
	return typeof value === 'string'
}
