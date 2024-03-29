import { parse as parseCookie, serialize } from 'cookie'

import { CourseBuilderError } from '../../errors'
import { CourseBuilderConfig } from '../../index'
import {
	CourseBuilderAction,
	RequestInternal,
	ResponseInternal,
} from '../../types'
import { isCourseBuilderAction } from './actions'
import { logger } from './logger'

async function getBody(req: Request): Promise<Record<string, any> | undefined> {
	if (!('body' in req) || !req.body || req.method !== 'POST') return

	const contentType = req.headers.get('content-type')
	if (contentType?.includes('application/json')) {
		return await req.json()
	} else if (contentType?.includes('application/x-www-form-urlencoded')) {
		const params = new URLSearchParams(await req.text())
		return Object.fromEntries(params)
	}
}

export async function toInternalRequest(
	req: Request,
	config: CourseBuilderConfig,
): Promise<RequestInternal | undefined> {
	try {
		config.basePath ??= '/coursebuilder'

		const url = new URL(req.url)

		const { action, providerId } = parseActionAndProviderId(
			url.pathname,
			config.basePath,
		)

		return {
			url,
			action,
			providerId,
			method: req.method as 'POST' | 'GET',
			headers: Object.fromEntries(req.headers),
			body: req.body ? await getBody(req) : undefined,
			cookies: parseCookie(req.headers.get('cookie') ?? '') ?? {},
			error: url.searchParams.get('error') ?? undefined,
			query: Object.fromEntries(url.searchParams),
		}
	} catch (e) {
		logger.error(e as Error)
		logger.debug('request', req)
	}
}

export function parseActionAndProviderId(
	pathname: string,
	base: string,
): {
	action: CourseBuilderAction
	providerId?: string
} {
	const a = pathname.match(new RegExp(`^${base}(.+)`))

	if (a === null) throw new UnknownAction(`Cannot parse action at ${pathname}`)

	const [_, actionAndProviderId] = a

	const b = actionAndProviderId.replace(/^\//, '').split('/')

	if (b.length !== 1 && b.length !== 2)
		throw new UnknownAction(`Cannot parse action at ${pathname}`)

	const [action, providerId] = b

	if (!isCourseBuilderAction(action))
		throw new UnknownAction(`Cannot parse action at ${pathname}`)

	if (
		providerId &&
		!['webhook', 'srt', 'session', 'subscribe-to-list'].includes(action)
	)
		throw new UnknownAction(`Cannot parse action at ${pathname}`)

	return { action, providerId }
}

export class UnknownAction extends CourseBuilderError {
	static type = 'UnknownAction'
}

export function toResponse(res: ResponseInternal): Response {
	const headers = new Headers(res.headers)

	res.cookies?.forEach((cookie) => {
		const { name, value, options } = cookie
		const cookieHeader = serialize(name, value, options)
		if (headers.has('Set-Cookie')) headers.append('Set-Cookie', cookieHeader)
		else headers.set('Set-Cookie', cookieHeader)
	})

	let body = res.body

	if (headers.get('content-type') === 'application/json')
		body = JSON.stringify(res.body)
	else if (headers.get('content-type') === 'application/x-www-form-urlencoded')
		body = new URLSearchParams(res.body).toString()

	const status = res.redirect ? 302 : res.status ?? 200
	const response = new Response(body, { headers, status })

	if (res.redirect) response.headers.set('Location', res.redirect)

	return response
}
