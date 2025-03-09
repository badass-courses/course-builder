import { describe, expect, it } from 'vitest'

import { getCookies } from './cookies'

describe('getCookies', () => {
	it('should handle basic functionality', () => {
		const result = getCookies('test')
		expect(result).toBe('test')
	})

	it('should handle edge cases', () => {
		expect(getCookies('')).toBe('')
	})
})
