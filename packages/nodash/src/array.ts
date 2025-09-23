/**
 * Returns a new array with unique values
 */
export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)]

/**
 * Returns a new array with unique values by a key
 */
export const uniqBy = <T>(arr: T[], iteratee: (item: T) => any): T[] => {
	const cb =
		typeof iteratee === 'function' ? iteratee : (obj: any) => obj[iteratee]

	return arr.filter(
		(item, index, self) => self.findIndex((t) => cb(t) === cb(item)) === index,
	)
}

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

/**
 * Returns the sum of all numbers in an array
 */
export const sum = (arr: number[]): number =>
	arr.reduce((acc, curr) => acc + curr, 0)

/**
 * Chunks array into groups of size n
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
	return arr.reduce((acc, _, i) => {
		if (i % size === 0) acc.push(arr.slice(i, i + size))
		return acc
	}, [] as T[][])
}

/**
 * Returns array without falsy values
 */
export const compact = <T>(arr: T[]): NonNullable<T>[] =>
	arr.filter(Boolean) as NonNullable<T>[]

/**
 * Returns array without specified values
 */
export const without = <T>(arr: T[], ...values: T[]): T[] =>
	arr.filter((item) => !values.includes(item))

/**
 * Returns array with elements that appear in all arrays
 */
export const intersection = <T>(...arrays: T[][]): T[] =>
	arrays.reduce((acc, curr) => acc.filter((item) => curr.includes(item)))

/**
 * Returns array shuffled randomly
 */
export const shuffle = <T>(arr: T[]): T[] => {
	const result = [...arr]
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[result[i], result[j]] = [result[j], result[i]]
	}
	return result
}

/**
 * Gets the last element of array
 */
export function last<T>(array: T[] | null | undefined): T | undefined {
	return array?.[array.length - 1]
}

/**
 * Takes n elements from the beginning of an array
 */
export function take<T>(array: T[] | null | undefined, n = 1): T[] {
	if (!array || n <= 0) return []
	return array.slice(0, n)
}
