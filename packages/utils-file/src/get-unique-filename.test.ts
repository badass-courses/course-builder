import { describe, expect, it } from 'vitest'

import { getUniqueFilename } from './get-unique-filename'

describe('getUniqueFilename', () => {
	it('should maintain the file extension', () => {
		const result = getUniqueFilename('test.jpg')
		expect(result).toMatch(/\.jpg$/)
	})

	it('should convert the extension to lowercase', () => {
		const result = getUniqueFilename('test.JPG')
		expect(result).toMatch(/\.jpg$/)
	})

	it('should add a unique ID', () => {
		const result1 = getUniqueFilename('test.jpg')
		const result2 = getUniqueFilename('test.jpg')
		expect(result1).not.toBe(result2)
	})

	it('should remove spaces and special characters', () => {
		const result = getUniqueFilename('test file with spaces!@#.jpg')
		expect(result).not.toMatch(/\s/)
		expect(result).not.toMatch(/[!@#]/)
	})

	it('should handle filenames without extensions', () => {
		const result = getUniqueFilename('test')
		expect(result).toMatch(/^test-[a-zA-Z0-9]+\.test$/)
	})

	it('should lowercase the entire filename', () => {
		const result = getUniqueFilename('TEST.JPG')
		expect(result).toMatch(/^test-[a-zA-Z0-9]+\.jpg$/)
	})
})
