import { db } from '@/db'
import { describe, expect, it, vi } from 'vitest'

import {
	countAllMinimalPosts,
	countAllMinimalPostsForUser,
	getAllMinimalPosts,
	getAllMinimalPostsForUser,
} from '../read'

// Mock the database
vi.mock('@/db', () => {
	const mockDb = {
		query: {
			contentResource: {
				findMany: vi.fn(),
			},
		},
		select: vi.fn(() => mockDb),
		from: vi.fn(() => mockDb),
		where: vi.fn(() => Promise.resolve([])),
	}
	return { db: mockDb }
})

// Mock the auth module
vi.mock('@/server/auth', () => ({
	getServerAuthSession: vi.fn().mockResolvedValue({
		session: { user: { id: 'test-user-id' } },
		ability: { can: vi.fn().mockReturnValue(true) },
	}),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
	redirect: vi.fn(),
}))

describe('Posts Read Functions with Pagination', () => {
	describe('getAllMinimalPosts', () => {
		it('should return paginated posts with limit and offset', async () => {
			const mockPosts = Array.from({ length: 20 }, (_, i) => ({
				id: `post-${i}`,
				createdById: 'user-1',
				createdAt: new Date(),
				fields: {
					title: `Post ${i}`,
					slug: `post-${i}`,
					state: 'published',
					postType: 'lesson',
				},
				tags: [],
			}))

			// Return only 10 posts when limit is 10
			const expectedPosts = mockPosts.slice(0, 10)

			vi.mocked(db.query.contentResource.findMany).mockResolvedValueOnce(
				expectedPosts as any,
			)

			const result = await getAllMinimalPosts(undefined, undefined, 10, 0)

			expect(result).toHaveLength(10)
			expect(result?.[0]?.id).toBe('post-0')
			expect(result?.[9]?.id).toBe('post-9')

			// Verify the findMany was called with correct parameters
			expect(db.query.contentResource.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 10,
					offset: 0,
				}),
			)
		})

		it('should handle pagination with offset', async () => {
			const mockPosts = Array.from({ length: 10 }, (_, i) => ({
				id: `post-${i + 10}`,
				createdById: 'user-1',
				createdAt: new Date(),
				fields: {
					title: `Post ${i + 10}`,
					slug: `post-${i + 10}`,
					state: 'published',
					postType: 'lesson',
				},
				tags: [],
			}))

			vi.mocked(db.query.contentResource.findMany).mockResolvedValueOnce(
				mockPosts as any,
			)

			const result = await getAllMinimalPosts(undefined, undefined, 10, 10)

			expect(result).toHaveLength(10)
			expect(result?.[0]?.id).toBe('post-10')
			expect(result?.[9]?.id).toBe('post-19')

			expect(db.query.contentResource.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 10,
					offset: 10,
				}),
			)
		})
	})

	describe('countAllMinimalPosts', () => {
		it('should return the total count of posts', async () => {
			const mockDb = db as any
			mockDb.where.mockResolvedValueOnce([{ count: 42 }])

			const count = await countAllMinimalPosts()

			expect(count).toBe(42)
		})

		it('should return 0 when no posts exist', async () => {
			const mockDb = db as any
			mockDb.where.mockResolvedValueOnce([])

			const count = await countAllMinimalPosts()

			expect(count).toBe(0)
		})
	})

	describe('getAllMinimalPostsForUser', () => {
		it('should return paginated posts for a specific user', async () => {
			const mockPosts = Array.from({ length: 15 }, (_, i) => ({
				id: `post-${i}`,
				createdById: 'test-user-id',
				createdAt: new Date(),
				fields: {
					title: `User Post ${i}`,
					slug: `user-post-${i}`,
					state: 'published',
					postType: 'lesson',
				},
				tags: [],
			}))

			const expectedPosts = mockPosts.slice(0, 10)

			vi.mocked(db.query.contentResource.findMany).mockResolvedValueOnce(
				expectedPosts as any,
			)

			const result = await getAllMinimalPostsForUser(
				'test-user-id',
				undefined,
				undefined,
				10,
				0,
			)

			expect(result).toHaveLength(10)
			expect(result?.[0]?.createdById).toBe('test-user-id')

			expect(db.query.contentResource.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 10,
					offset: 0,
				}),
			)
		})
	})

	describe('countAllMinimalPostsForUser', () => {
		it('should return the total count of posts for a user', async () => {
			const mockDb = db as any
			mockDb.where.mockResolvedValueOnce([{ count: 25 }])

			const count = await countAllMinimalPostsForUser('test-user-id')

			expect(count).toBe(25)
		})

		it('should return 0 when userId is not provided', async () => {
			const count = await countAllMinimalPostsForUser(undefined)

			expect(count).toBe(0)
		})
	})
})
