import { beforeEach, describe, expect, it, vi } from 'vitest'

import { get_embedding } from './openai'

// Mock OpenAI module
vi.mock('openai', () => {
	// Create a mock function we can change between tests
	const mockCreate = vi.fn().mockResolvedValue({
		data: [
			{
				embedding: [0.1, 0.2, 0.3],
				index: 0,
				object: 'embedding',
			},
		],
	})

	const OpenAIMock = vi.fn().mockImplementation(() => ({
		embeddings: {
			create: mockCreate,
		},
	}))

	return {
		default: OpenAIMock,
	}
})

describe('OpenAI Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.resetModules()
	})

	describe('get_embedding', () => {
		it('should generate an embedding from text', async () => {
			const result = await get_embedding('test text')

			expect(result).toEqual({
				embedding: [0.1, 0.2, 0.3],
				index: 0,
				object: 'embedding',
			})
		})

		it('should handle empty data arrays in response', () => {
			// Test the response processor directly
			const result = get_embedding.processResponse({ data: [] })
			expect(result).toEqual({ embedding: null })
		})
	})
})
