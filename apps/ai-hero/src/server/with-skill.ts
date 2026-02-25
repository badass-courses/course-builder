import { NextResponse } from 'next/server'
import {
	createRequestContext,
	log,
	serializeError,
	withLogContext,
} from '@/server/logger'

export type SkillRequest = Request

type NextHandler<Args extends [SkillRequest, ...unknown[]]> = (
	...args: Args
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response

type RequestTelemetry = {
	url: string
	pathWithQuery: string
	path: string
	method: string
	host: string | null
	forwardedHost: string | null
	deploymentUrl: string | null
	vercelEnv: string | null
	vercelId: string | null
	userAgent: string | null
	referer: string | null
	clientIp: string | null
	contentType: string | null
	contentLength: string | null
	queryString: string
	queryKeys: string[]
	query: Record<string, string>
}

const SENSITIVE_QUERY_KEY_PATTERN =
	/(token|secret|password|signature|code|key|auth|jwt|credential|session)/i

function extractRequestTelemetry(req: Request): RequestTelemetry {
	const url = new URL(req.url)
	const queryEntries = Array.from(url.searchParams.entries())
	const safeEntries: [string, string][] = queryEntries.map(([key, value]) => [
		key,
		SENSITIVE_QUERY_KEY_PATTERN.test(key) ? '[REDACTED]' : value,
	])
	const query = Object.fromEntries(safeEntries)
	const safeSearchParams = new URLSearchParams(safeEntries)
	const safeQueryString = safeSearchParams.toString()
	const pathWithQuery = `${url.pathname}${safeQueryString ? `?${safeQueryString}` : ''}`
	const envDeploymentUrl = process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: null
	return {
		url: req.url,
		pathWithQuery,
		path: url.pathname,
		method: req.method,
		host: req.headers.get('host') || url.host,
		forwardedHost: req.headers.get('x-forwarded-host'),
		deploymentUrl: req.headers.get('x-vercel-deployment-url') || envDeploymentUrl,
		vercelEnv: req.headers.get('x-vercel-env') || process.env.VERCEL_ENV || null,
		vercelId: req.headers.get('x-vercel-id'),
		userAgent: req.headers.get('user-agent'),
		referer: req.headers.get('referer'),
		clientIp:
			req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
		contentType: req.headers.get('content-type'),
		contentLength: req.headers.get('content-length'),
		queryString: safeQueryString ? `?${safeQueryString}` : '',
		queryKeys: Object.keys(query),
		query,
	}
}

export function withSkill<Args extends [SkillRequest, ...unknown[]]>(
	params: NextHandler<Args>,
): NextHandler<Args> {
	return async (...args: Args) => {
		const req = args[0]
		const startedAt = Date.now()
		const context = createRequestContext(req)
		const request = extractRequestTelemetry(req)

		return withLogContext(context, async () => {
			await log.info('api.request.started', {
				requestId: context.requestId,
				...request,
			})

			try {
				const response = await params(...args)
				const durationMs = Date.now() - startedAt
				const status = response instanceof Response ? response.status : null
				const ok = response instanceof Response ? response.ok : null
				const statusCode = status

				await log.info('api.request.completed', {
					requestId: context.requestId,
					durationMs,
					status: statusCode,
					ok,
					...request,
				})

				if (statusCode !== null && statusCode >= 400) {
					const failurePayload = {
						requestId: context.requestId,
						durationMs,
						statusCode,
						ok,
						...request,
					}

					if (statusCode >= 500) {
						await log.error('api.request.failed_response', failurePayload)
					} else {
						await log.warn('api.request.failed_response', failurePayload)
					}
				}

				return response
			} catch (error) {
				const durationMs = Date.now() - startedAt
				await log.error('api.request.failed', {
					requestId: context.requestId,
					durationMs,
					...request,
					error: serializeError(error),
				})
				throw error
			}
		})
	}
}
