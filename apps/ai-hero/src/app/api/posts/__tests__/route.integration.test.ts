import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from './test-server'
import { createAuthHeaders } from './test-utils'

const BASE_URL = 'http://localhost:3000'

describe('Posts API', () => {
	describe('POST /api/posts', () => {
		it('requires authentication', async () => {
			const mockPost = {
				title: 'Test Post',
				postType: 'article',
				createdById: 'test-user-id',
			}

			const response = await fetch(`${BASE_URL}/api/posts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(mockPost),
			})

			expect(response.status).toBe(401)
		})

		it('creates a new post with valid input', async () => {
			const mockPost = {
				title: 'Test Post',
				postType: 'article',
				createdById: 'test-user-id',
			}

			const response = await fetch(`${BASE_URL}/api/posts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...createAuthHeaders(),
				},
				body: JSON.stringify(mockPost),
			})

			expect(response.status).toBe(201)
			const data = await response.json()
			expect(data).toMatchObject({
				id: expect.any(String),
				type: 'post',
				fields: {
					title: mockPost.title,
					state: 'draft',
					visibility: 'public',
					slug: expect.stringMatching(/^test-post~.+/),
					postType: mockPost.postType,
				},
				createdById: mockPost.createdById,
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			})
		})

		it('returns 400 for invalid input', async () => {
			const invalidPost = {
				title: '', // Empty title should fail validation
				postType: 'article',
				createdById: 'test-user-id',
			}

			const response = await fetch(`${BASE_URL}/api/posts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...createAuthHeaders(),
				},
				body: JSON.stringify(invalidPost),
			})

			expect(response.status).toBe(400)
			const error = await response.json()
			expect(error).toHaveProperty('error')
		})
	})

	describe('GET /api/posts', () => {
		beforeEach(() => {
			// Reset handlers before each test
			server.resetHandlers()
		})

		it('requires authentication', async () => {
			const response = await fetch(`${BASE_URL}/api/posts`)
			expect(response.status).toBe(401)
		})

		it('returns a list of posts', async () => {
			const mockPosts = [
				{
					id: '1',
					title: 'Test Post 1',
					description: 'Description 1',
					content: 'Content 1',
					type: 'article',
					status: 'published',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					id: '2',
					title: 'Test Post 2',
					description: 'Description 2',
					content: 'Content 2',
					type: 'article',
					status: 'draft',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			]

			server.use(
				http.get(`${BASE_URL}/api/posts`, () => {
					return HttpResponse.json(mockPosts)
				}),
			)

			const response = await fetch(`${BASE_URL}/api/posts`, {
				headers: createAuthHeaders(),
			})
			expect(response.status).toBe(200)

			const data = await response.json()
			expect(Array.isArray(data)).toBe(true)
			expect(data).toHaveLength(2)
			expect(data[0]).toMatchObject(mockPosts[0])
		})

		it('supports filtering by status', async () => {
			const mockPosts = [
				{
					id: '1',
					title: 'Published Post',
					status: 'published',
				},
			]

			server.use(
				http.get(`${BASE_URL}/api/posts`, ({ request }) => {
					const url = new URL(request.url)
					const status = url.searchParams.get('status')

					if (status === 'published') {
						return HttpResponse.json(mockPosts)
					}
					return HttpResponse.json([])
				}),
			)

			const response = await fetch(`${BASE_URL}/api/posts?status=published`, {
				headers: createAuthHeaders(),
			})
			expect(response.status).toBe(200)

			const data = await response.json()
			expect(data).toHaveLength(1)
			expect(data[0].status).toBe('published')
		})
	})

	describe('PUT /api/posts', () => {
		beforeEach(() => {
			server.resetHandlers()
		})

		it('requires authentication', async () => {
			const updateData = {
				id: '123',
				fields: {
					title: 'Updated Post',
					slug: 'updated-post~123',
					state: 'draft',
					visibility: 'unlisted',
				},
				tags: [],
			}

			const response = await fetch(`${BASE_URL}/api/posts?action=save`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			})

			expect(response.status).toBe(401)
		})

		it('updates a post with valid input', async () => {
			const updateData = {
				id: '123',
				fields: {
					title: 'Updated Post',
					slug: 'updated-post~123',
					state: 'draft',
					visibility: 'unlisted',
				},
				tags: [],
			}

			const response = await fetch(`${BASE_URL}/api/posts?action=save`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...createAuthHeaders(),
				},
				body: JSON.stringify(updateData),
			})

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data).toMatchObject({
				...updateData,
				updatedAt: expect.any(String),
				updatedById: expect.any(String),
			})
		})

		it('returns 400 for invalid action', async () => {
			const updateData = {
				id: '123',
				fields: {
					title: 'Updated Post',
					slug: 'updated-post~123',
					state: 'draft',
					visibility: 'unlisted',
				},
				tags: [],
			}

			const response = await fetch(`${BASE_URL}/api/posts?action=invalid`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...createAuthHeaders(),
				},
				body: JSON.stringify(updateData),
			})

			expect(response.status).toBe(400)
			const error = await response.json()
			expect(error).toHaveProperty('error', 'Invalid action')
		})

		it('returns 400 for invalid input', async () => {
			const invalidData = {
				id: '123',
				fields: {
					title: '', // Empty title should fail validation
					slug: 'updated-post~123',
					state: 'draft',
					visibility: 'unlisted',
				},
				tags: [],
			}

			const response = await fetch(`${BASE_URL}/api/posts?action=save`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...createAuthHeaders(),
				},
				body: JSON.stringify(invalidData),
			})

			expect(response.status).toBe(400)
			const error = await response.json()
			expect(error).toHaveProperty('error')
		})

		it('returns 404 for non-existent post', async () => {
			const updateData = {
				id: 'non-existent',
				fields: {
					title: 'Updated Post',
					slug: 'updated-post~123',
					state: 'draft',
					visibility: 'unlisted',
				},
				tags: [],
			}

			server.use(
				http.put(`${BASE_URL}/api/posts`, async () => {
					return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
				}),
			)

			const response = await fetch(`${BASE_URL}/api/posts?action=save`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...createAuthHeaders(),
				},
				body: JSON.stringify(updateData),
			})

			expect(response.status).toBe(404)
			const error = await response.json()
			expect(error).toHaveProperty('error', 'Post not found')
		})
	})

	describe('DELETE /api/posts', () => {
		beforeEach(() => {
			server.resetHandlers()
		})

		it('requires authentication', async () => {
			const response = await fetch(`${BASE_URL}/api/posts?id=123`, {
				method: 'DELETE',
			})

			expect(response.status).toBe(401)
		})

		it('returns 400 when post ID is missing', async () => {
			const response = await fetch(`${BASE_URL}/api/posts`, {
				method: 'DELETE',
				headers: createAuthHeaders(),
			})

			expect(response.status).toBe(400)
			const error = await response.json()
			expect(error).toHaveProperty('error', 'Missing post ID')
		})

		it('returns 404 for non-existent post', async () => {
			const response = await fetch(`${BASE_URL}/api/posts?id=non-existent`, {
				method: 'DELETE',
				headers: createAuthHeaders(),
			})

			expect(response.status).toBe(404)
			const error = await response.json()
			expect(error).toHaveProperty('error', 'Post not found')
		})

		it('successfully deletes an existing post', async () => {
			server.use(
				http.delete(`${BASE_URL}/api/posts`, () => {
					return HttpResponse.json({ message: 'Post deleted successfully' })
				}),
			)

			const response = await fetch(`${BASE_URL}/api/posts?id=123`, {
				method: 'DELETE',
				headers: createAuthHeaders(),
			})

			expect(response.status).toBe(200)
			const data = await response.json()
			expect(data).toHaveProperty('message', 'Post deleted successfully')
		})

		it('handles server errors gracefully', async () => {
			server.use(
				http.delete(`${BASE_URL}/api/posts`, () => {
					return HttpResponse.json(
						{ error: 'Failed to delete post' },
						{ status: 500 },
					)
				}),
			)

			const response = await fetch(`${BASE_URL}/api/posts?id=123`, {
				method: 'DELETE',
				headers: createAuthHeaders(),
			})

			expect(response.status).toBe(500)
			const error = await response.json()
			expect(error).toHaveProperty('error', 'Failed to delete post')
		})
	})
})
