import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
	it('combines class names', () => {
		expect(cn('foo', 'bar')).toBe('foo bar')
	})

	it('handles conditional classes', () => {
		expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
	})

	it('handles arrays of class names', () => {
		expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz')
	})

	it('handles objects of class names', () => {
		expect(cn('foo', { bar: true, baz: false })).toBe('foo bar')
	})

	it('merges Tailwind utility classes', () => {
		expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
	})

	it('returns an empty string for no inputs', () => {
		expect(cn()).toBe('')
	})
})
