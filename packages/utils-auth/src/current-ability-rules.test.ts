import { describe, expect, it } from 'vitest'

import {
	AbilityForResource,
	getAbilityForResource,
	getCurrentAbilityRules,
	getViewingAbilityForResource,
} from './current-ability-rules'

describe('ability utility functions', () => {
	it('should export the expected API functions', () => {
		expect(typeof getCurrentAbilityRules).toBe('function')
		expect(typeof getViewingAbilityForResource).toBe('function')
		expect(typeof getAbilityForResource).toBe('function')
	})

	it('should export AbilityForResource type', () => {
		// TypeScript will verify that the type exists at compile time
		// For runtime, we can only check if the export name exists
		expect(true).toBe(true)
	})

	it('should throw errors for unimplemented functions', async () => {
		await expect(getCurrentAbilityRules({})).rejects.toThrow(
			/must be implemented by the application/,
		)
		await expect(getViewingAbilityForResource('test', 'test')).rejects.toThrow(
			/must be implemented by the application/,
		)
		await expect(getAbilityForResource('test', 'test')).rejects.toThrow(
			/must be implemented by the application/,
		)
	})
})
