import { describe, expect, it, test } from 'vitest'

import { isEmpty, isNotEmpty } from '../src/lib/utils/is-empty'

describe('isEmpty', () => {
	test('handles null/undefined', () => {
		expect(isEmpty(null)).toBe(true)
		expect(isEmpty(undefined)).toBe(true)
	})

	test('handles strings', () => {
		expect(isEmpty('')).toBe(true)
		expect(isEmpty('   ')).toBe(true)
		expect(isEmpty('hello')).toBe(false)
		expect(isEmpty(' hi ')).toBe(false)
	})

	test('handles arrays', () => {
		expect(isEmpty([])).toBe(true)
		expect(isEmpty([1, 2, 3])).toBe(false)
		expect(isEmpty([null])).toBe(false)
	})

	test('handles objects', () => {
		expect(isEmpty({})).toBe(true)
		expect(isEmpty({ a: 1 })).toBe(false)
		expect(isEmpty({ length: 0 })).toBe(false)
	})

	test('handles Map/Set', () => {
		expect(isEmpty(new Map())).toBe(true)
		expect(isEmpty(new Set())).toBe(true)
		expect(isEmpty(new Map([['a', 1]]))).toBe(false)
		expect(isEmpty(new Set([1]))).toBe(false)
	})

	test('handles other types', () => {
		expect(isEmpty(0)).toBe(false)
		expect(isEmpty(false)).toBe(false)
		expect(isEmpty(true)).toBe(false)
	})
})

describe('isNotEmpty', () => {
	test('type guard works', () => {
		const value: string | null = 'hello'
		if (isNotEmpty(value)) {
			expect(value.length).toBeGreaterThan(0)
		}
	})
})
