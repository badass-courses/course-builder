import { describe, expect, it } from 'vitest'

import { guid } from './guid'

describe('guid', () => {
	it('generates a 5-character string', () => {
		const id = guid()
		expect(id.length).toBe(5)
	})

	it('generates different values on each call', () => {
		const id1 = guid()
		const id2 = guid()
		expect(id1).not.toBe(id2)
	})

	it('only contains allowed characters (alphanumeric lowercase)', () => {
		const id = guid()
		expect(id).toMatch(/^[0-9a-z]{5}$/)
	})
})
