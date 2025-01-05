import { describe, expect, test } from 'vitest'

import { find, first, last, sortBy, take } from '../array'

describe('first', () => {
	test('gets first element of array', () => {
		expect(first([1, 2, 3])).toBe(1)
		expect(first(['a', 'b', 'c'])).toBe('a')
	})

	test('handles empty arrays', () => {
		expect(first([])).toBe(undefined)
	})

	test('handles null/undefined', () => {
		expect(first(null)).toBe(undefined)
		expect(first(undefined)).toBe(undefined)
	})

	test('handles arrays with one element', () => {
		expect(first([42])).toBe(42)
	})

	test('handles arrays with undefined/null elements', () => {
		expect(first([undefined, 1, 2])).toBe(undefined)
		expect(first([null, 1, 2])).toBe(null)
	})
})

describe('sortBy', () => {
	const users = [
		{ id: 1, name: 'Bob', age: 30 },
		{ id: 2, name: 'Alice', age: 25 },
		{ id: 3, name: 'Charlie', age: null },
		{ id: 4, name: 'David', age: undefined },
	]

	test('sorts by property path', () => {
		const sorted = sortBy(users, 'name')
		expect(sorted.map((u) => u.name)).toEqual([
			'Alice',
			'Bob',
			'Charlie',
			'David',
		])
	})

	test('sorts by iteratee function', () => {
		const sorted = sortBy(users, (u) => u.age)
		expect(sorted.map((u) => u.id)).toEqual([2, 1, 3, 4])
	})

	test('handles null/undefined values', () => {
		const items = [null, 3, 1, undefined, 2]
		const sorted = sortBy(items, (x) => x)
		expect(sorted).toEqual([1, 2, 3, null, undefined])
	})

	test('preserves original array', () => {
		const original = [3, 1, 2]
		const sorted = sortBy(original, (x) => x)
		expect(sorted).toEqual([1, 2, 3])
		expect(original).toEqual([3, 1, 2])
	})

	test('handles empty arrays', () => {
		expect(sortBy([], 'whatever')).toEqual([])
	})

	test('maintains stability for equal values', () => {
		const items = [
			{ group: 'A', val: 1 },
			{ group: 'A', val: 2 },
			{ group: 'B', val: 3 },
		]
		const sorted = sortBy(items, 'group')
		expect(sorted[0].val).toBe(1)
		expect(sorted[1].val).toBe(2)
	})
})

describe('find', () => {
	test('finds element in array', () => {
		const array = [1, 2, 3, 4]
		expect(find(array, (x: number) => x > 2)).toBe(3)
	})

	test('returns undefined if no match', () => {
		const array = [1, 2, 3]
		expect(find(array, (x: number) => x > 5)).toBe(undefined)
	})

	test('handles null/undefined arrays', () => {
		expect(find(null, (x: number) => x > 2)).toBe(undefined)
		expect(find(undefined, (x: number) => x > 2)).toBe(undefined)
	})

	test('provides index to predicate', () => {
		const array = ['a', 'b', 'c']
		expect(find(array, (_, i) => i === 1)).toBe('b')
	})
})

describe('last', () => {
	test('gets last element of array', () => {
		expect(last([1, 2, 3])).toBe(3)
		expect(last(['a', 'b', 'c'])).toBe('c')
	})

	test('handles empty arrays', () => {
		expect(last([])).toBe(undefined)
	})

	test('handles null/undefined', () => {
		expect(last(null)).toBe(undefined)
		expect(last(undefined)).toBe(undefined)
	})

	test('handles arrays with one element', () => {
		expect(last([42])).toBe(42)
	})

	test('handles arrays with undefined/null elements', () => {
		expect(last([1, 2, undefined])).toBe(undefined)
		expect(last([1, 2, null])).toBe(null)
	})
})

describe('take', () => {
	test('takes n elements from array', () => {
		expect(take([1, 2, 3, 4], 2)).toEqual([1, 2])
		expect(take(['a', 'b', 'c'], 1)).toEqual(['a'])
	})

	test('defaults to taking 1 element', () => {
		expect(take([1, 2, 3])).toEqual([1])
	})

	test('handles n greater than array length', () => {
		expect(take([1, 2], 5)).toEqual([1, 2])
	})

	test('handles empty arrays', () => {
		expect(take([], 2)).toEqual([])
	})

	test('handles null/undefined', () => {
		expect(take(null, 2)).toEqual([])
		expect(take(undefined, 2)).toEqual([])
	})

	test('handles zero n', () => {
		expect(take([1, 2, 3], 0)).toEqual([])
	})

	test('handles negative n', () => {
		expect(take([1, 2, 3], -1)).toEqual([])
	})
})
