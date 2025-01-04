/**
 * Picks specified properties from an object
 */
export const pick = <T extends object, K extends keyof T>(
	obj: T,
	keys: K[],
): Pick<T, K> => {
	return keys.reduce(
		(acc, key) => {
			if (key in obj) acc[key] = obj[key]
			return acc
		},
		{} as Pick<T, K>,
	)
}

/**
 * Omits specified properties from an object
 */
export const omit = <T extends object, K extends keyof T>(
	obj: T,
	keys: K[],
): Omit<T, K> => {
	return Object.fromEntries(
		Object.entries(obj).filter(([key]) => !keys.includes(key as K)),
	) as Omit<T, K>
}

/**
 * Checks if a value is empty (null, undefined, empty string/array/object/map/set)
 */
export function isEmpty(value: any): boolean {
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

/**
 * Checks if value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
	return value === null || value === undefined
}

/**
 * Creates an object composed of the own enumerable string keyed properties
 * of object that predicate doesn't return truthy for
 */
export function omitBy<T extends object>(
	object: T | null | undefined,
	predicate: (value: T[keyof T], key: string) => boolean,
): Partial<T> {
	if (!object) return {}

	return Object.entries(object).reduce((acc, [key, value]) => {
		if (!predicate(value as T[keyof T], key)) {
			acc[key as keyof T] = value as T[keyof T]
		}
		return acc
	}, {} as Partial<T>)
}
