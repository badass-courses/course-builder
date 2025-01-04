/**
 * Returns a new array with unique values
 */
export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)]

/**
 * Groups array elements by a key
 */
export const groupBy = <T>(
	arr: T[],
	key: keyof T,
): Record<string | number, T[]> => {
	return arr.reduce(
		(acc, item) => {
			const groupKey = String(item[key])
			acc[groupKey] = acc[groupKey] || []
			acc[groupKey].push(item)
			return acc
		},
		{} as Record<string | number, T[]>,
	)
}

type PropertyPath = string | number | symbol
type SortByIteratee<T> = ((obj: T) => any) | PropertyPath

/**
 * Sorts an array by a property path or iteratee function
 */
export function sortBy<T>(array: T[], iteratee: SortByIteratee<T>): T[] {
	const cb =
		typeof iteratee === 'function' ? iteratee : (obj: any) => obj[iteratee]

	return [...array].sort((a, b) => {
		const valA = cb(a)
		const valB = cb(b)

		if (valA === valB) return 0
		if (valA == null) return 1
		if (valB == null) return -1
		return valA < valB ? -1 : 1
	})
}

/**
 * Gets the first element of array
 */
export function first<T>(array: T[] | null | undefined): T | undefined {
	return array?.[0]
}

/**
 * Finds the first element in an array that matches a predicate
 */
export function find<T>(
	array: T[] | null | undefined,
	predicate: (value: T, index: number, obj: T[]) => boolean,
): T | undefined {
	return array?.find(predicate)
}
