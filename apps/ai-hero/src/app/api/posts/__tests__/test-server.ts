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
	return AUTH_MAP[token] || null
}

const defaultHandlers = [
	http.post(`${BASE_URL}/api/posts`, async ({ request }) => {
		const user = getAuthUser(request)
		if (!user) {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()

		if (!body.title || body.title.trim() === '') {
			return HttpResponse.json(
				{ message: 'Title is required' },
				{ status: 400 },
			)
		}

		return HttpResponse.json(
			{
				...body,
				id: '123',
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
]

export const server = setupServer(...defaultHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
