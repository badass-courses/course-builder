/**
 * Converts a string to Chicago Manual of Style title case
 *
 * This follows Chicago Manual of Style guidelines for title capitalization, where:
 * - First and last words are always capitalized
 * - Major words (nouns, pronouns, verbs, adjectives, adverbs) are capitalized
 * - Articles (a, an, the), coordinating conjunctions (and, but, or, nor),
 *   and prepositions (at, by, to, etc.) are lowercase unless they are the
 *   first or last word
 * - Special cases like Roman numerals (I, II, III) are always uppercase
 * - Names with prefixes like "Mc" or "Mac" have special capitalization
 *
 * @param str - The string to convert to Chicago title case
 * @returns The string formatted according to Chicago title case rules
 *
 * @example
 * ```ts
 * toChicagoTitleCase("the lord of the rings")
 * // Returns "The Lord of the Rings"
 *
 * toChicagoTitleCase("star wars episode iv a new hope")
 * // Returns "Star Wars Episode IV a New Hope"
 *
 * toChicagoTitleCase("mcdonald and macintosh went to the store")
 * // Returns "McDonald and MacIntosh Went to the Store"
 * ```
 */
export function toChicagoTitleCase(str: string): string {
	const lowerCaseWords = new Set([
		'a',
		'an',
		'the',
		'at',
		'by',
		'for',
		'in',
		'of',
		'on',
		'to',
		'up',
		'and',
		'as',
		'but',
		'or',
		'nor',
	])
	const specialCases = {
		I: true,
		II: true,
		III: true,
		IV: true,
		V: true,
		VI: true,
	}

	// First pass to handle standard title casing rules
	const titleCased = str.replace(/\w\S*/g, (word, index) => {
		if (
			index > 0 &&
			index < str.length - 1 &&
			lowerCaseWords.has(word.toLowerCase())
		) {
			return word.toLowerCase()
		}
		if (specialCases.hasOwnProperty(word.toUpperCase())) {
			return word.toUpperCase()
		}
		return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
	})

	// Second pass to handle Mc and Mac prefixes
	return titleCased.replace(
		/\b(mc|mac)([a-z])/gi,
		(match, prefix, letter) =>
			prefix.charAt(0).toUpperCase() + prefix.slice(1) + letter.toUpperCase(),
	)
}
