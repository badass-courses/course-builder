import { vi } from 'vitest'

interface MockDb {
	query: {
		contentResourceVersion: {
			findFirst: ReturnType<typeof vi.fn>
		}
	}
	update: ReturnType<typeof vi.fn>
	insert: ReturnType<typeof vi.fn>
	transaction: ReturnType<typeof vi.fn>
}

export const mockDb: MockDb = {
	query: {
		contentResourceVersion: {
			findFirst: vi.fn(),
		},
	},
	update: vi.fn().mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	}),
	insert: vi.fn().mockReturnValue({
		values: vi.fn().mockResolvedValue(undefined),
	}),
	transaction: vi.fn().mockImplementation(async (callback) => callback(mockDb)),
}

// Reset all mocks between tests
export const resetMocks = () => {
	mockDb.query.contentResourceVersion.findFirst.mockReset()
	mockDb.update.mockClear()
	mockDb.insert.mockClear()
	mockDb.transaction.mockClear()
}
