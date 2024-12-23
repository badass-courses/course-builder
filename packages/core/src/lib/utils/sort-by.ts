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
