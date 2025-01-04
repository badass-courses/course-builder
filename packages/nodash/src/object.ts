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
