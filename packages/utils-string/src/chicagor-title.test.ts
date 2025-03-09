import { describe, expect, it } from 'vitest'

import { toChicagoTitleCase } from './chicagor-title'

describe('toChicagoTitleCase', () => {
	it('capitalizes the first word', () => {
		expect(toChicagoTitleCase('the quick brown fox')).toMatch(/^The/)
	})

	it('capitalizes the last word', () => {
		expect(toChicagoTitleCase('the quick brown fox')).toMatch(/Fox$/)
	})

	it('capitalizes major words', () => {
		const result = toChicagoTitleCase(
			'the quick brown fox jumps over the lazy dog',
		)
		expect(result).toBe('The Quick Brown Fox Jumps Over the Lazy Dog')
	})

	it('keeps articles, conjunctions, and prepositions lowercase', () => {
		const result = toChicagoTitleCase(
			'the war of the worlds and its impact on literature',
		)
		expect(result).toBe('The War of the Worlds and Its Impact on Literature')
	})

	it('capitalizes Roman numerals', () => {
		const result = toChicagoTitleCase('star wars episode iv a new hope')
		expect(result).toBe('Star Wars Episode IV a New Hope')
	})

	it('correctly handles special case prefixes like Mc and Mac', () => {
		const result = toChicagoTitleCase(
			'mcdonald and macintosh went to the store',
		)
		expect(result).toBe('McDonald and MacIntosh Went to the Store')
	})

	it('converts ALL CAPS to proper title case', () => {
		const result = toChicagoTitleCase('THE LORD OF THE RINGS')
		expect(result).toBe('The Lord of the Rings')
	})

	it('handles empty strings', () => {
		expect(toChicagoTitleCase('')).toBe('')
	})
})
