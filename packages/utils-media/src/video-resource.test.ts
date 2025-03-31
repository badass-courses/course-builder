import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pollVideoResource } from './video-resource'

describe('pollVideoResource', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	it('should yield resource when found on first attempt', async () => {
		// Mock a successful resource getter
		const mockResource = { id: 'test-id', data: 'test data' }
		const mockGetResource = vi.fn().mockResolvedValue(mockResource)

		// Get the generator
		const generator = pollVideoResource('test-id', mockGetResource)

		// Get the first value
		const result = await generator.next()

		// Check expectations
		expect(mockGetResource).toHaveBeenCalledWith('test-id')
		expect(result.value).toBe(mockResource)
		expect(result.done).toBe(false)

		// Ensure generator is done after yielding
		const next = await generator.next()
		expect(next.done).toBe(true)
	})

	it('should retry until resource is found', async () => {
		// Mock a getter that fails twice then succeeds
		const mockResource = { id: 'test-id', data: 'test data' }
		const mockGetResource = vi
			.fn()
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(mockResource)

		// Get the generator
		const generator = pollVideoResource('test-id', mockGetResource)

		// Start the generator
		const promise = generator.next()

		// Run pending timers until resource is found (should be on 3rd attempt)
		await vi.runOnlyPendingTimersAsync() // First attempt - fails
		await vi.runOnlyPendingTimersAsync() // Second attempt - fails
		await vi.runOnlyPendingTimersAsync() // Third attempt - succeeds

		// Now the resource should be found
		const result = await promise

		// Check expectations
		expect(mockGetResource).toHaveBeenCalledTimes(3)
		expect(result.value).toBe(mockResource)
	})

	it('should wrap error properly when max attempts reached', async () => {
		// Mock a resource getter function that always returns null
		const mockGetResource = vi.fn().mockResolvedValue(null)

		// Setup vi.spyOn for setTimeout
		vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
			if (typeof fn === 'function') fn()
			return 1 as any
		})

		// Get the generator with reduced max attempts
		const generator = pollVideoResource('test-id', mockGetResource, 3)

		// Verify the promise rejects with the correct error message
		await expect(generator.next().catch((e) => e.message)).resolves.toBe(
			'Resource not found after maximum attempts',
		)

		// Verify the getter was called the expected number of times
		expect(mockGetResource).toHaveBeenCalledTimes(3)

		// Clean up mock
		vi.restoreAllMocks()
	})

	it('should use custom polling parameters', async () => {
		// Mock a getter that returns null then success
		const mockResource = { id: 'test-id', data: 'test data' }
		const mockGetResource = vi
			.fn()
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(mockResource)

		// Custom params: 5 max attempts, 100ms initial delay, 200ms increment
		const generator = pollVideoResource('test-id', mockGetResource, 5, 100, 200)

		// Start the generator
		const promise = generator.next()

		// Run timers to simulate resource being found on second attempt
		await vi.runOnlyPendingTimersAsync() // First attempt - fails
		await vi.runOnlyPendingTimersAsync() // Second attempt - succeeds

		// Now the resource should be found
		const result = await promise

		// Check expectations
		expect(mockGetResource).toHaveBeenCalledTimes(2)
		expect(result.value).toBe(mockResource)
	})
})
