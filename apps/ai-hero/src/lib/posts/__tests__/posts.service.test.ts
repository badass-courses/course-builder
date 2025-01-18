import { courseBuilderAdapter } from '@/db'
import { createTestDb } from '@/db/test-db'
import { clearTestPosts, createTestPost } from '@/db/test-helpers'
import {
	createPost,
	deletePost,
	getPosts,
	PostError,
	updatePost,
} from '@/lib/posts/posts.service'
import { defineAbility } from '@casl/ability'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
	courseBuilderAdapter: {
		createContentResource: vi.fn(),
		getContentResource: vi.fn(),
		getContentResources: vi.fn(),
		updateContentResource: vi.fn(),
		deleteContentResource: vi.fn(),
	},
}))

describe('Posts Service', () => {
	const { db, cleanup } = createTestDb()
	const mockUserId = 'user-1'

	const adminAbility = defineAbility((can) => {
		can('manage', 'Content')
	})

	const restrictedAbility = defineAbility((can) => {
		can('read', 'Content')
	})

	const noAbility = defineAbility(() => {})

	beforeEach(() => {
		vi.resetAllMocks()
	})

	describe('createPost', () => {
		it('throws unauthorized when user lacks create permission', async () => {
			await expect(
				createPost({
					data: { title: 'Test Post', postType: 'article' },
					userId: mockUserId,
					ability: noAbility,
				}),
			).rejects.toThrow(new PostError('Unauthorized', 401))
		})

		it('throws validation error for invalid input', async () => {
			await expect(
				createPost({
					data: { title: '', postType: 'invalid' },
					userId: mockUserId,
					ability: adminAbility,
				}),
			).rejects.toThrow(new PostError('Invalid input', 400))
		})

		it('creates a post with valid input', async () => {
			const mockPost = {
				title: 'Test Post',
				postType: 'article',
			}

			const mockResponse = {
				id: '123',
				...mockPost,
				createdById: mockUserId,
				createdAt: new Date(),
				state: 'draft',
				visibility: 'private',
			}

			vi.mocked(
				courseBuilderAdapter.createContentResource,
			).mockResolvedValueOnce(mockResponse)

			const result = await createPost({
				data: mockPost,
				userId: mockUserId,
				ability: adminAbility,
			})

			expect(result).toMatchObject(mockResponse)
		})
	})

	describe('getPosts', () => {
		it('throws unauthorized when user lacks read permission', async () => {
			await expect(
				getPosts({ userId: mockUserId, ability: noAbility }),
			).rejects.toThrow(new PostError('Unauthorized', 401))
		})

		it('returns a single post by slug', async () => {
			const mockPost = {
				id: '123',
				title: 'Test Post',
				postType: 'article',
				createdById: mockUserId,
				createdAt: new Date(),
				state: 'draft',
				visibility: 'private',
			}

			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				mockPost,
			)

			const result = await getPosts({
				userId: mockUserId,
				ability: adminAbility,
				slug: mockPost.id,
			})

			expect(result).toMatchObject(mockPost)
		})

		it('throws not found for non-existent slug', async () => {
			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				null,
			)

			await expect(
				getPosts({
					userId: mockUserId,
					ability: adminAbility,
					slug: 'non-existent',
				}),
			).rejects.toThrow(new PostError('Post not found', 404))
		})

		it('returns all posts for user', async () => {
			const mockPosts = [
				{
					id: '123',
					title: 'Test Post 1',
					postType: 'article',
					createdById: mockUserId,
					createdAt: new Date(),
					state: 'draft',
					visibility: 'private',
				},
				{
					id: '456',
					title: 'Test Post 2',
					postType: 'article',
					createdById: mockUserId,
					createdAt: new Date(),
					state: 'draft',
					visibility: 'private',
				},
			]

			vi.mocked(courseBuilderAdapter.getContentResources).mockResolvedValueOnce(
				mockPosts,
			)

			const result = await getPosts({
				userId: mockUserId,
				ability: restrictedAbility,
			})

			expect(result).toEqual(mockPosts)
		})
	})

	describe('updatePost', () => {
		it('throws unauthorized when user lacks manage permission', async () => {
			const mockPost = {
				id: '123',
				title: 'Test Post',
				postType: 'article',
				createdById: mockUserId,
				createdAt: new Date(),
				state: 'draft',
				visibility: 'private',
			}

			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				mockPost,
			)

			await expect(
				updatePost({
					id: '123',
					data: {
						id: '123',
						fields: {
							title: 'Updated Title',
							body: 'Test body',
							slug: 'test-post',
							state: 'draft',
							visibility: 'private',
						},
					},
					action: 'save',
					userId: mockUserId,
					ability: restrictedAbility,
				}),
			).rejects.toThrow(new PostError('Unauthorized', 401))
		})

		it('validates action parameter', async () => {
			await expect(
				updatePost({
					id: '123',
					data: {
						id: '123',
						fields: {
							title: 'Updated Title',
							body: 'Test body',
							slug: 'test-post',
							state: 'draft',
							visibility: 'private',
						},
					},
					action: 'invalid',
					userId: mockUserId,
					ability: adminAbility,
				}),
			).rejects.toThrow(new PostError('Invalid action', 400))
		})

		it('updates a post with valid input', async () => {
			const mockPost = {
				id: '123',
				title: 'Test Post',
				postType: 'article',
				createdById: mockUserId,
				createdAt: new Date(),
				state: 'draft',
				visibility: 'private',
			}

			const updates = {
				id: '123',
				fields: {
					title: 'Updated Title',
					body: 'Test body',
					slug: 'test-post',
					state: 'draft',
					visibility: 'private',
				},
			}

			const mockResponse = {
				...mockPost,
				...updates.fields,
				updatedById: mockUserId,
				updatedAt: new Date(),
			}

			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				mockPost,
			)
			vi.mocked(
				courseBuilderAdapter.updateContentResource,
			).mockResolvedValueOnce(mockResponse)

			const result = await updatePost({
				id: mockPost.id,
				data: updates,
				action: 'save',
				userId: mockUserId,
				ability: adminAbility,
			})

			expect(result).toMatchObject(mockResponse)
		})
	})

	describe('deletePost', () => {
		it('throws unauthorized when user lacks delete permission', async () => {
			const mockPost = {
				id: '123',
				title: 'Test Post',
				postType: 'article',
				createdById: mockUserId,
				createdAt: new Date(),
				state: 'draft',
				visibility: 'private',
			}

			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				mockPost,
			)

			await expect(
				deletePost({
					id: '123',
					ability: restrictedAbility,
				}),
			).rejects.toThrow(new PostError('Unauthorized', 401))
		})

		it('throws not found for non-existent post', async () => {
			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				null,
			)

			await expect(
				deletePost({
					id: 'non-existent',
					ability: adminAbility,
				}),
			).rejects.toThrow(new PostError('Post not found', 404))
		})

		it('soft deletes an existing post', async () => {
			const mockPost = {
				id: '123',
				title: 'Test Post',
				postType: 'article',
				createdById: mockUserId,
				createdAt: new Date(),
				state: 'draft',
				visibility: 'private',
			}

			vi.mocked(courseBuilderAdapter.getContentResource).mockResolvedValueOnce(
				mockPost,
			)
			vi.mocked(
				courseBuilderAdapter.deleteContentResource,
			).mockResolvedValueOnce()

			const result = await deletePost({
				id: mockPost.id,
				ability: adminAbility,
			})

			expect(result).toEqual({ message: 'Post deleted successfully' })
			expect(courseBuilderAdapter.deleteContentResource).toHaveBeenCalledWith(
				mockPost.id,
			)
		})
	})

	afterEach(() => {
		clearTestPosts(db)
		vi.clearAllMocks()
	})

	afterAll(() => {
		cleanup()
	})
})
