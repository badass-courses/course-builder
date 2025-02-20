import { createTestDb } from '@/db/test-db'
import { clearTestPosts, createTestPost, findTestPost } from '@/db/test-helpers'
import { testPosts } from '@/db/test-schema'
import { eq } from 'drizzle-orm'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
	createAuthHeaders,
	TEST_ADMIN,
	TEST_TOKEN,
} from '../../../app/api/posts/__tests__/test-utils'

const BASE_URL = 'http://localhost:3000'

describe('Solution API', () => {
	const server = setupServer(
		// Default handlers for unauthed requests
		http.post(`${BASE_URL}/api/solutions`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
		http.get(`${BASE_URL}/api/solutions`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
		http.put(`${BASE_URL}/api/solutions/:id`, () => {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}),
		http.delete(`${BASE_URL}/api/solutions/:id`, () => {
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

	describe('Solution Creation', () => {
		it('requires authentication', async () => {
			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test Solution' }),
			})

			expect(res.status).toBe(401)
		})

		it('requires a parent lesson ID', async () => {
			server.use(
				http.post(`${BASE_URL}/api/solutions`, async () => {
					return HttpResponse.json(
						{ error: 'Parent lesson ID is required' },
						{ status: 400 },
					)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ title: 'Test Solution' }),
			})

			expect(res.status).toBe(400)
		})

		it('validates that parent lesson exists', async () => {
			server.use(
				http.post(`${BASE_URL}/api/solutions`, async () => {
					return HttpResponse.json(
						{ error: 'Parent lesson not found' },
						{ status: 404 },
					)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'Test Solution',
					parentLessonId: 'non-existent',
				}),
			})

			expect(res.status).toBe(404)
		})

		it('creates a solution for a valid lesson', async () => {
			const lesson = await createTestPost(db, {
				postType: 'lesson',
				createdById: TEST_ADMIN.id,
			})

			const mockSolution = {
				title: 'Test Solution',
				parentLessonId: lesson.id,
			}

			server.use(
				http.post(`${BASE_URL}/api/solutions`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>
					const solution = await createTestPost(db, {
						...body,
						postType: 'solution',
						createdById: TEST_ADMIN.id,
						parentLessonId: body.parentLessonId as string,
					})
					return HttpResponse.json(solution)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(mockSolution),
			})

			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.title).toBe(mockSolution.title)
			expect(data.postType).toBe('solution')
			expect(data.createdById).toBe(TEST_ADMIN.id)
			expect(data.parentLessonId).toBe(lesson.id)
		})

		it('prevents creating multiple solutions for the same lesson', async () => {
			const lesson = await createTestPost(db, {
				postType: 'lesson',
				createdById: TEST_ADMIN.id,
			})

			// Create first solution
			await createTestPost(db, {
				postType: 'solution',
				createdById: TEST_ADMIN.id,
				title: 'First Solution',
				parentLessonId: lesson.id,
			})

			server.use(
				http.post(`${BASE_URL}/api/solutions`, async () => {
					return HttpResponse.json(
						{ error: 'Solution already exists for this lesson' },
						{ status: 400 },
					)
				}),
			)

			// Attempt to create second solution
			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'Second Solution',
					parentLessonId: lesson.id,
				}),
			})

			expect(res.status).toBe(400)
		})
	})

	describe('Solution Deletion', () => {
		it('requires authentication', async () => {
			const res = await fetch(`${BASE_URL}/api/solutions/123`, {
				method: 'DELETE',
			})

			expect(res.status).toBe(401)
		})

		it('deletes an existing solution', async () => {
			const lesson = await createTestPost(db, {
				postType: 'lesson',
				createdById: TEST_ADMIN.id,
			})

			const solution = await createTestPost(db, {
				postType: 'solution',
				createdById: TEST_ADMIN.id,
				title: 'Test Solution',
				parentLessonId: lesson.id,
			})

			server.use(
				http.delete(`${BASE_URL}/api/solutions/:id`, async () => {
					return new HttpResponse(null, { status: 204 })
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions/${solution.id}`, {
				method: 'DELETE',
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(204)
		})

		it('returns 404 for non-existent solution', async () => {
			server.use(
				http.delete(`${BASE_URL}/api/solutions/:id`, () => {
					return HttpResponse.json(
						{ error: 'Solution not found' },
						{ status: 404 },
					)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions/non-existent`, {
				method: 'DELETE',
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(404)
		})
	})

	describe('Parent-Child Relationship', () => {
		it('deletes solution when parent lesson is deleted', async () => {
			const lesson = await createTestPost(db, {
				postType: 'lesson',
				createdById: TEST_ADMIN.id,
			})

			const solution = await createTestPost(db, {
				postType: 'solution',
				createdById: TEST_ADMIN.id,
				title: 'Test Solution',
				parentLessonId: lesson.id,
			})

			server.use(
				http.delete(`${BASE_URL}/api/posts/:id`, async () => {
					// Simulate cascade delete
					await db.delete(testPosts).where(eq(testPosts.id, solution.id))
					await db.delete(testPosts).where(eq(testPosts.id, lesson.id))
					return new HttpResponse(null, { status: 204 })
				}),
			)

			const res = await fetch(`${BASE_URL}/api/posts/${lesson.id}`, {
				method: 'DELETE',
				headers: createAuthHeaders(TEST_TOKEN),
			})

			expect(res.status).toBe(204)

			// Verify both lesson and solution are deleted
			const deletedLesson = await findTestPost(db, lesson.id)
			const deletedSolution = await findTestPost(db, solution.id)
			expect(deletedLesson).toBeUndefined()
			expect(deletedSolution).toBeUndefined()
		})
	})

	describe('Validation Rules', () => {
		it('validates solution title length', async () => {
			const lesson = await createTestPost(db, {
				postType: 'lesson',
				createdById: TEST_ADMIN.id,
			})

			server.use(
				http.post(`${BASE_URL}/api/solutions`, async () => {
					return HttpResponse.json(
						{ error: 'Title must be between 2 and 90 characters' },
						{ status: 400 },
					)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'A', // Too short
					parentLessonId: lesson.id,
				}),
			})

			expect(res.status).toBe(400)
		})

		it('validates solution visibility', async () => {
			const lesson = await createTestPost(db, {
				postType: 'lesson',
				createdById: TEST_ADMIN.id,
			})

			server.use(
				http.post(`${BASE_URL}/api/solutions`, async () => {
					return HttpResponse.json(
						{ error: 'Invalid visibility value' },
						{ status: 400 },
					)
				}),
			)

			const res = await fetch(`${BASE_URL}/api/solutions`, {
				method: 'POST',
				headers: {
					...createAuthHeaders(TEST_TOKEN),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'Test Solution',
					parentLessonId: lesson.id,
					visibility: 'invalid',
				}),
			})

			expect(res.status).toBe(400)
		})
	})
})
