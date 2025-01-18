import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const BASE_URL = 'http://localhost:3000'

const defaultHandlers = [
	http.post(`${BASE_URL}/api/posts`, async ({ request }) => {
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

	http.get(`${BASE_URL}/api/posts`, () => {
		return HttpResponse.json([])
	}),
]

export const server = setupServer(...defaultHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
