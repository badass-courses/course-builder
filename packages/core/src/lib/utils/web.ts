import { getToken } from '@auth/core/jwt'
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

async function getBody(
	req: Request,
	config: CourseBuilderConfig,
): Promise<Record<string, any> | undefined> {
	const headers = Object.fromEntries(req.headers)
	const isStripeWebhook = ['stripe-signature'].every((prop: string) => {
		return prop in headers
	})

	if (isStripeWebhook) {
		let parsedBody
		const stripeProvider = config.providers.find((p: any) => p.id === 'stripe')
		parsedBody = await req.text()
		stripeProvider?.options?.paymentsAdapter.verifyWebhookSignature(
			parsedBody,
			headers['stripe-signature'],
		)
		parsedBody = JSON.parse(parsedBody)
		return parsedBody
	}

	if (!('body' in req) || !req.body || req.method !== 'POST') return

	const contentType = req.headers.get('content-type')
	if (contentType?.includes('application/json')) {
		try {
			return await req.json()
		} catch (e) {
			logger.error(e as Error)
			return undefined
		}
	} else if (contentType?.includes('application/x-www-form-urlencoded')) {
		const params = new URLSearchParams(await req.text())
		return Object.fromEntries(params)
	}
}

/**
 * takes a `Request` object and converts it into an internal request object
 * that we use throughout the system
 * @param req
 * @param config
 * @returns
 */
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

		console.debug({
			url,
			action,
			providerId,
		})

		return {
			url,
			action,
			providerId,
			method: req.method as 'POST' | 'GET',
			headers: Object.fromEntries(req.headers),
			body: req.body ? await getBody(req, config) : undefined,
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
		throw new UnknownAction(`**Cannot parse action at ${pathname}`)

	const [action, providerId] = b

	if (!isCourseBuilderAction(action))
		throw new UnknownAction(`***Cannot parse action at ${pathname}`)

	if (
		providerId &&
		![
			'webhook',
			'srt',
			'session',
			'subscribe-to-list',
			'checkout',
			'redeem',
			'subscriber',
			'lookup',
			'claimed',
			'nameUpdate',
			'transfer',
			'refund',
			'create-magic-link',
		].includes(action)
	)
		throw new UnknownAction(
			`**** Cannot parse action at ${pathname}. add it to the list in web.ts?`,
		)

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

	let body: string | undefined = undefined

	if (headers.get('content-type') === 'application/json') {
		// Ensure body is serialized to string before creating Response
		body = JSON.stringify(res.body ?? null)
	} else if (
		headers.get('content-type') === 'application/x-www-form-urlencoded'
	) {
		body = new URLSearchParams(res.body as any).toString()
	} else if (typeof res.body === 'string') {
		body = res.body
	} else if (res.body !== undefined && res.body !== null) {
		// Fallback: try to stringify if body exists but isn't a string
		body = String(res.body)
	}

	const status = res.redirect ? 302 : (res.status ?? 200)
	const response = new Response(body, { headers, status })

	if (res.redirect) response.headers.set('Location', res.redirect)

	return response
}
