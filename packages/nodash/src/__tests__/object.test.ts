import { describe, expect, test } from 'vitest'

import { isEmpty, isNil, isNotEmpty, omitBy } from '../object'

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

describe('isNil', () => {
	test('returns true for null and undefined', () => {
		expect(isNil(null)).toBe(true)
		expect(isNil(undefined)).toBe(true)
	})

	test('returns false for other values', () => {
		expect(isNil(0)).toBe(false)
		expect(isNil('')).toBe(false)
		expect(isNil(false)).toBe(false)
		expect(isNil({})).toBe(false)
		expect(isNil([])).toBe(false)
	})
})

describe('omitBy', () => {
	test('omits properties based on predicate', () => {
		const object = { a: 1, b: null, c: 3, d: undefined }
		const result = omitBy(object, isNil)
		expect(result).toEqual({ a: 1, c: 3 })
	})

	test('handles null/undefined objects', () => {
		expect(omitBy(null, isNil)).toEqual({})
		expect(omitBy(undefined, isNil)).toEqual({})
	})

	test('provides key to predicate', () => {
		const object = { a: 1, b: 2, c: 3 }
		const result = omitBy(object, (_, key) => key === 'b')
		expect(result).toEqual({ a: 1, c: 3 })
	})

	test('returns empty object when all properties are omitted', () => {
		const object = { a: 1, b: 2 }
		const result = omitBy(object, () => true)
		expect(result).toEqual({})
	})
})
