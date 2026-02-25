import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => {
	return {
		createRequestContext: vi.fn(),
		withLogContext: vi.fn(),
		serializeError: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	}
})

vi.mock('@/server/logger', () => ({
	createRequestContext: loggerMocks.createRequestContext,
	withLogContext: loggerMocks.withLogContext,
	serializeError: loggerMocks.serializeError,
	log: {
		info: loggerMocks.info,
		warn: loggerMocks.warn,
		error: loggerMocks.error,
	},
}))

import { withSkill } from './with-skill'

describe('withSkill', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		loggerMocks.createRequestContext.mockReturnValue({
			requestId: 'req_test_123',
		})
		loggerMocks.withLogContext.mockImplementation(
			(_context: unknown, fn: () => unknown) => fn(),
		)
		loggerMocks.serializeError.mockImplementation((error: unknown) => ({
			message: error instanceof Error ? error.message : String(error),
		}))
		loggerMocks.info.mockResolvedValue(undefined)
		loggerMocks.warn.mockResolvedValue(undefined)
		loggerMocks.error.mockResolvedValue(undefined)
	})

	it('emits started/completed events and redacts sensitive query params', async () => {
		const handler = withSkill(async () => {
			return new Response(JSON.stringify({ ok: true }), { status: 201 })
		})

		const request = new Request(
			'https://aihero.dev/api/posts?token=super-secret&q=telemetry&apiKey=abc123',
			{
				method: 'POST',
				headers: {
					'user-agent': 'vitest',
					'x-forwarded-for': '203.0.113.5',
				},
			},
		)

		const response = await handler(request)

		expect(response.status).toBe(201)
		expect(loggerMocks.createRequestContext).toHaveBeenCalledWith(request)
		expect(loggerMocks.withLogContext).toHaveBeenCalledWith(
			{ requestId: 'req_test_123' },
			expect.any(Function),
		)

		expect(loggerMocks.info).toHaveBeenNthCalledWith(
			1,
			'api.request.started',
			expect.objectContaining({
				requestId: 'req_test_123',
				path: '/api/posts',
				method: 'POST',
				clientIp: '203.0.113.5',
				query: {
					token: '[REDACTED]',
					q: 'telemetry',
					apiKey: '[REDACTED]',
				},
			}),
		)

		expect(loggerMocks.info).toHaveBeenNthCalledWith(
			2,
			'api.request.completed',
			expect.objectContaining({
				requestId: 'req_test_123',
				path: '/api/posts',
				method: 'POST',
				status: 201,
				ok: true,
				durationMs: expect.any(Number),
				query: {
					token: '[REDACTED]',
					q: 'telemetry',
					apiKey: '[REDACTED]',
				},
			}),
		)

		const startedPayload = loggerMocks.info.mock.calls[0]?.[1] as {
			queryString: string
		}
		expect(startedPayload.queryString).toContain('token=%5BREDACTED%5D')
		expect(startedPayload.queryString).toContain('apiKey=%5BREDACTED%5D')
		expect(startedPayload.queryString).not.toContain('super-secret')
		expect(startedPayload.queryString).not.toContain('abc123')
		expect(loggerMocks.warn).not.toHaveBeenCalled()
		expect(loggerMocks.error).not.toHaveBeenCalled()
	})

	it('passes through additional handler args and preserves the response', async () => {
		const handler = withSkill(
			async (_request: Request, context: { params: { lessonId: string } }) => {
				return new Response(context.params.lessonId, { status: 202 })
			},
		)

		const request = new Request('https://aihero.dev/api/lessons/lesson-123')
		const response = await handler(request, { params: { lessonId: 'lesson-123' } })

		expect(response.status).toBe(202)
		expect(await response.text()).toBe('lesson-123')
		expect(loggerMocks.info).toHaveBeenCalledTimes(2)
		expect(loggerMocks.warn).not.toHaveBeenCalled()
		expect(loggerMocks.error).not.toHaveBeenCalled()
	})

	it('emits failed telemetry with serialized error and rethrows', async () => {
		const failure = new Error('handler exploded')
		const serialized = { message: 'handler exploded', name: 'Error' }
		loggerMocks.serializeError.mockReturnValue(serialized)

		const handler = withSkill(async () => {
			throw failure
		})

		const request = new Request('https://aihero.dev/api/fail?password=secret-pass')

		await expect(handler(request)).rejects.toThrow('handler exploded')

		expect(loggerMocks.info).toHaveBeenCalledTimes(1)
		expect(loggerMocks.warn).not.toHaveBeenCalled()
		expect(loggerMocks.error).toHaveBeenCalledWith(
			'api.request.failed',
			expect.objectContaining({
				requestId: 'req_test_123',
				path: '/api/fail',
				method: 'GET',
				durationMs: expect.any(Number),
				error: serialized,
				query: {
					password: '[REDACTED]',
				},
				queryString: '?password=%5BREDACTED%5D',
			}),
		)
	})

	it('emits failed_response telemetry with deployment metadata for 4xx responses', async () => {
		const handler = withSkill(async () => {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
			})
		})

		const request = new Request(
			'https://aihero-dev.vercel.app/api/shortlinks?analytics=true&id=123',
			{
				headers: {
					'x-vercel-env': 'production',
					'x-vercel-id': 'iad1::abcd-1234',
					'x-forwarded-host': 'www.aihero.dev',
				},
			},
		)

		const response = await handler(request)
		expect(response.status).toBe(401)

		expect(loggerMocks.warn).toHaveBeenCalledWith(
			'api.request.failed_response',
			expect.objectContaining({
				requestId: 'req_test_123',
				statusCode: 401,
				path: '/api/shortlinks',
				pathWithQuery: '/api/shortlinks?analytics=true&id=123',
				host: 'aihero-dev.vercel.app',
				forwardedHost: 'www.aihero.dev',
				vercelEnv: 'production',
				vercelId: 'iad1::abcd-1234',
			}),
		)
	})
})
