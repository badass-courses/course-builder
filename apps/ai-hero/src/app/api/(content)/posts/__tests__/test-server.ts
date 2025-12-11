import { CreatePostRequestSchema, UpdatePostRequestSchema } from '@/lib/posts'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { TEST_ADMIN, TEST_TOKEN, TEST_USER } from './test-utils'

const BASE_URL = 'http://localhost:3000'

// Map tokens to users for our test auth system
const AUTH_MAP = {
	[TEST_TOKEN]: TEST_USER,
	'admin-token': TEST_ADMIN,
}

function getAuthUser(request: Request) {
	const authHeader = request.headers.get('Authorization')
	if (!authHeader) return null

	const token = authHeader.split(' ')[1]
	return AUTH_MAP[token as keyof typeof AUTH_MAP] || null
}

const defaultHandlers = [
	http.post(`${BASE_URL}/api/posts`, async ({ request }) => {
		const user = getAuthUser(request)
		if (!user) {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const result = CreatePostRequestSchema.safeParse(body)

		if (!result.success) {
			return HttpResponse.json(
				{ error: { issues: result.error.issues } },
				{ status: 400 },
			)
		}

		const { title, postType, createdById } = result.data

		return HttpResponse.json(
			{
				id: '123',
				type: 'post',
				fields: {
					title,
					state: 'draft',
					visibility: 'public',
					slug: `${title.toLowerCase().replace(/\s+/g, '-')}~123`,
					postType,
				},
				createdById: createdById || user.id,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{ status: 201 },
		)
	}),

	http.get(`${BASE_URL}/api/posts`, async ({ request }) => {
		const user = getAuthUser(request)
		if (!user) {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		return HttpResponse.json([])
	}),

	http.put(`${BASE_URL}/api/posts`, async ({ request }) => {
		const user = getAuthUser(request)
		if (!user) {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const url = new URL(request.url)
		const action = url.searchParams.get('action') || 'save'
		if (!['save', 'publish', 'unpublish', 'archive'].includes(action)) {
			return HttpResponse.json({ error: 'Invalid action' }, { status: 400 })
		}

		const body = await request.json()
		const result = UpdatePostRequestSchema.safeParse(body)

		if (!result.success) {
			return HttpResponse.json(
				{ error: { issues: result.error.issues } },
				{ status: 400 },
			)
		}

		return HttpResponse.json({
			...result.data,
			updatedAt: new Date().toISOString(),
			updatedById: user.id,
		})
	}),

	http.delete(`${BASE_URL}/api/posts`, async ({ request }) => {
		const user = getAuthUser(request)
		if (!user) {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const url = new URL(request.url)
		const id = url.searchParams.get('id')

		if (!id) {
			return HttpResponse.json({ error: 'Missing post ID' }, { status: 400 })
		}

		if (id === 'non-existent') {
			return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
		}

		return HttpResponse.json({ message: 'Post deleted successfully' })
	}),
]

export const server = setupServer(...defaultHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
