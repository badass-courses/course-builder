/**
 * Converts string to camelCase
 */
export const camelCase = (str: string): string => {
	return str
		.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
		.replace(/^[A-Z]/, (chr) => chr.toLowerCase())
}

/**
 * Converts string to kebab-case
 */
export const kebabCase = (str: string): string => {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase()
}
