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
				description: 'Test Description',
				content: 'Test Content',
				type: 'article',
				status: 'draft',
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
				description: 'Test Description',
				content: 'Test Content',
				type: 'article',
				status: 'draft',
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
				...mockPost,
				id: expect.any(String),
				createdAt: expect.any(String),
				updatedAt: expect.any(String),
			})
		})

		it('returns 400 for invalid input', async () => {
			const invalidPost = {
				title: '', // Empty title should fail validation
				description: 'Test Description',
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
			expect(error).toHaveProperty('message')
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
})
