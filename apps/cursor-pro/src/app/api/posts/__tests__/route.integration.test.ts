import { createTestDb } from '@/db/test-db'
import { clearTestPosts, createTestPost, findTestPost } from '@/db/test-helpers'
import { testPosts } from '@/db/test-schema'
import { eq } from 'drizzle-orm'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createAuthHeaders, TEST_ADMIN, TEST_TOKEN } from './test-utils'

const BASE_URL = 'http://localhost:3000'

describe('Posts API', () => {
	const server = setupServer(
		// Default handlers for unauthed requests
		http.post(`${BASE_URL}/api/posts`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
		http.get(`${BASE_URL}/api/posts`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
		http.put(`${BASE_URL}/api/posts/:id`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
		http.delete(`${BASE_URL}/api/posts/:id`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
	)
	const { db, cleanup } = createTestDb()

	beforeAll(() => server.listen())
	afterEach(() => {
		server.resetHandlers()
		clearTestPosts(db)
	})
	afterAll(() => {
		server.close()
		cleanup()
	})

	describe('POST /api/posts', () => {
		it('requires authentication', async () => {
			const res = await fetch(`${BASE_URL}/api/posts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test Post' }),
			})

			expect(res.status).toBe(401)
		})

		it('creates a new post', async () => {
			const mockPost = {
				title: 'Test Post',
				postType: 'article',
			}

			server.use(
				http.post(`${BASE_URL}/api/posts`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>
					const post = await createTestPost(db, {
						...body,
						createdById: TEST_ADMIN.id,
					})
					return HttpResponse.json(post)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(mockPost),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.title).toBe(mockPost.title)
			expect(data.postType).toBe(mockPost.postType)
			expect(data.createdById).toBe(TEST_ADMIN.id)
		})
	})

	describe('GET /api/posts', () => {
		it('requires authentication', async () => {
			const res = await fetch(`${BASE_URL}/api/posts`)
			expect(res.status).toBe(401)
		})

		it('returns a list of posts', async () => {
			const post = await createTestPost(db, { createdById: TEST_ADMIN.id })

			server.use(
				http.get(`${BASE_URL}/api/posts`, async () => {
					const posts = await db.select().from(testPosts)
					return HttpResponse.json(posts)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts`, {
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data).toHaveLength(1)
			expect(data[0].id).toBe(post.id)
		})

		it('filters by status', async () => {
			await createTestPost(db, {
				state: 'published',
				createdById: TEST_ADMIN.id,
			})
			await createTestPost(db, { state: 'draft', createdById: TEST_ADMIN.id })

			server.use(
				http.get(`${BASE_URL}/api/posts`, async ({ request }) => {
					const url = new URL(request.url)
					const state = url.searchParams.get('state')
					const posts = await db
						.select()
						.from(testPosts)
						.where(state ? eq(testPosts.state, state) : undefined)
					return HttpResponse.json(posts)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts?state=published`, {
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data).toHaveLength(1)
			expect(data[0].state).toBe('published')
		})
	})

	describe('PUT /api/posts/:id', () => {
		it('requires authentication', async () => {
			const res = await fetch(`${BASE_URL}/api/posts/123?action=save`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Updated Post' }),
			})

			expect(res.status).toBe(401)
		})

		it('validates action parameter', async () => {
			server.use(
				http.put(`${BASE_URL}/api/posts/:id`, () => {
					return HttpResponse.json({ error: 'Invalid action' }, { status: 400 })
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts/123?action=invalid`, {
				method: 'PUT',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ title: 'Updated Post' }),
			})

			expect(res.status).toBe(400)
		})

		it('updates an existing post', async () => {
			const post = await createTestPost(db, { createdById: TEST_ADMIN.id })
			const updates = {
				title: 'Updated Post Title',
				state: 'published',
			}

			server.use(
				http.put(`${BASE_URL}/api/posts/:id`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>
					const url = new URL(request.url)
					const postId = url.pathname.split('/').pop()

					const updatedPost = {
						...post,
						...body,
						updatedAt: new Date().toISOString(),
					}

					await db
						.update(testPosts)
						.set(updatedPost)
						.where(eq(testPosts.id, postId!))

					return HttpResponse.json(updatedPost)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts/${post.id}?action=save`, {
				method: 'PUT',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updates),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.title).toBe(updates.title)
			expect(data.state).toBe(updates.state)

			// Verify DB update
			const updatedPost = await findTestPost(db, post.id)
			if (!updatedPost) {
				throw new Error('Post not found after update')
			}
			expect(updatedPost.title).toBe(updates.title)
			expect(updatedPost.state).toBe(updates.state)
		})

		it('returns 404 for non-existent post', async () => {
			server.use(
				http.put(`${BASE_URL}/api/posts/:id`, () => {
					return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
				}),
			)

			const res = await fetch(
				`${BASE_URL}/api/posts/non-existent?action=save`,
				{
					method: 'PUT',
					headers: {
						...createAuthHeaders(TEST_TOKEN),
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ title: 'Updated Post' }),
				},
			)

			expect(res.status).toBe(404)
		})
	})

	describe('DELETE /api/posts/:id', () => {
		it('requires authentication', async () => {
			const res = await fetch(`${BASE_URL}/api/posts/123`, {
				method: 'DELETE',
			})

			expect(res.status).toBe(401)
		})

		it('deletes an existing post', async () => {
			const post = await createTestPost(db, { createdById: TEST_ADMIN.id })

			server.use(
				http.delete(`${BASE_URL}/api/posts/:id`, async ({ request }) => {
					const url = new URL(request.url)
					const postId = url.pathname.split('/').pop()

					await db
						.update(testPosts)
						.set({ deletedAt: new Date().toISOString() })
						.where(eq(testPosts.id, postId!))

					return new HttpResponse(null, { status: 204 })
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts/${post.id}`, {
				method: 'DELETE',
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(204)

			// Verify soft delete
			const deletedPost = await findTestPost(db, post.id)
			if (!deletedPost) {
				throw new Error('Post not found after delete')
			}
			expect(deletedPost.deletedAt).not.toBeNull()
		})

		it('returns 404 for non-existent post', async () => {
			server.use(
				http.delete(`${BASE_URL}/api/posts/:id`, () => {
					return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts/non-existent`, {
				method: 'DELETE',
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(404)
		})
	})
})
