import { vi } from 'vitest'

import { CourseBuilder, CourseBuilderConfig, createActionURL } from '../src'
import { CourseBuilderAdapter } from '../src/adapters'
import { LoggerInstance } from '../src/lib/utils/logger'
import { CourseBuilderAction } from '../src/types'

export function TestAdapter(): CourseBuilderAdapter {
	return {
		createContentResource: vi.fn(),
		getContentResource: vi.fn(),
		getVideoResource: vi.fn(),
		updateContentResourceFields: vi.fn(),
		createUser: vi.fn(),
		getUser: vi.fn(),
		getUserByEmail: vi.fn(),
		getUserByAccount: vi.fn(),
		updateUser: vi.fn(),
		deleteUser: vi.fn(),
		linkAccount: vi.fn(),
		unlinkAccount: vi.fn(),
		createSession: vi.fn(),
		getSessionAndUser: vi.fn(),
		updateSession: vi.fn(),
		deleteSession: vi.fn(),
		createVerificationToken: vi.fn(),
		useVerificationToken: vi.fn(),
	}
}

export const logger: LoggerInstance = {
	debug: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}

export const getExpires = (maxAge = 30 * 24 * 60 * 60 * 1000) => {
	const now = Date.now()
	vi.setSystemTime(now)
	return new Date(now + maxAge)
}

export function testConfig(
	overrides?: Partial<CourseBuilderConfig>,
): CourseBuilderConfig {
	return {
		logger,
		basePath: '/coursebuilder',
		providers: [],
		...overrides,
	}
}

export async function makeCourseBuilderRequest(params: {
	action: CourseBuilderAction
	cookies?: Record<string, string>
	host?: string
	path?: string
	query?: Record<string, string>
	body?: any
	config?: Partial<CourseBuilderConfig>
}) {
	const { action, body, cookies = {}, host = 'coursebuilder.test' } = params
	const config = testConfig(params.config)
	const headers = new Headers({ host: host })
	for (const [name, value] of Object.entries(cookies))
		headers.append('cookie', `${name}=${value}`)

	let url: string | URL = createActionURL(
		action,
		'https',
		headers,
		{},
		config.basePath,
	)
	if (params.path) url = `${url}${params.path}`
	if (params.query) url = `${url}?${new URLSearchParams(params.query)}`
	const request = new Request(url, {
		method: body ? 'POST' : 'GET',
		headers,
		body,
	})
	const response = (await CourseBuilder(request, config)) as Response
	return {
		response,
		logger: config.logger,
	}
}
