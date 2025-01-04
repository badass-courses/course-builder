import { describe, expect, test } from 'vitest'

import { sortBy } from '../array'

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
