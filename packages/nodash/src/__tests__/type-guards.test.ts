import { describe, expect, test } from 'vitest'

import { isString } from '../type-guards'

describe('isString', () => {
	test('returns true for strings', () => {
		expect(isString('')).toBe(true)
		expect(isString('hello')).toBe(true)
		expect(isString(`template literal`)).toBe(true)
		expect(isString(String('wrapped'))).toBe(true)
	})

	test('returns false for non-strings', () => {
		expect(isString(null)).toBe(false)
		expect(isString(undefined)).toBe(false)
		expect(isString(123)).toBe(false)
		expect(isString({})).toBe(false)
		expect(isString([])).toBe(false)
		expect(isString(true)).toBe(false)
		expect(isString(Symbol())).toBe(false)
		expect(isString(() => {})).toBe(false)
	})
})
