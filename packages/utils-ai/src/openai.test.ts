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

	return {
		default: vi.fn(() => ({
			embeddings: {
				create: mockCreate,
			},
		})),
	}
})

describe('OpenAI Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks()
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

		it('should return object with null embedding if no data is returned', async () => {
			// Get access to the mock
			const openaiModule = await import('openai')
			const mockOpenAI = openaiModule.default()

			// Override the create method for this test only
			mockOpenAI.embeddings.create.mockResolvedValueOnce({ data: [] })

			const result = await get_embedding('test text')

			expect(result).toEqual({ embedding: null })
		})
	})
})
