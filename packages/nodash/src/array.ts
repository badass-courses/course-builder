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
