import { Inngest } from 'inngest'

import type { CourseBuilderAdapter } from './adapters'
import { CourseBuilderInternal } from './lib'
import { assertConfig } from './lib/utils/assert'
import { logger, LoggerInstance, setLogger } from './lib/utils/logger'
import { toInternalRequest, toResponse } from './lib/utils/web'
import type { Provider } from './providers'
import { CookiesOptions } from './types'

export async function CourseBuilder(
	request: Request,
	config: CourseBuilderConfig,
): Promise<Response> {
	setLogger(config.logger, config.debug)

	const internalRequest = await toInternalRequest(request, config)
	if (!internalRequest) {
		return new Response('Bad request', { status: 400 })
	}

	const warningsOrError = assertConfig(internalRequest, config)
	if (Array.isArray(warningsOrError)) {
		warningsOrError.forEach(logger.warn)
	} else if (warningsOrError) {
		logger.error(warningsOrError)
		return new Response('Internal Server Error', { status: 500 })
	}
	const isRedirect = request.headers?.has('X-Course-Builder-Return-Redirect')

	try {
		const internalResponse = await CourseBuilderInternal(
			internalRequest,
			config,
		)
		const response = toResponse(internalResponse)
		const url = response.headers.get('Location')
		if (!isRedirect || !url) return response

		return Response.json({ url }, { headers: response.headers })
	} catch (e) {
		logger.error(e as Error)
		return new Response('Internal Server Error', { status: 500 })
	}
}

export interface CourseBuilderConfig {
	adapter: CourseBuilderAdapter
	providers: Provider[]
	debug?: boolean
	basePath?: string
	logger?: LoggerInstance
	cookies?: Partial<CookiesOptions>
	useSecureCookies?: boolean
	inngest: Inngest
}
