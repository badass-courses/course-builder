import { AuthConfig } from '@auth/core'
import { Inngest } from 'inngest'

import type { CourseBuilderAdapter } from './adapters'
import { CourseBuilderInternal } from './lib'
import { assertConfig } from './lib/utils/assert'
import { createActionURL, setEnvDefaults } from './lib/utils/env.js'
import { logger, setLogger, type LoggerInstance } from './lib/utils/logger'
import { toInternalRequest, toResponse } from './lib/utils/web'
import type { Provider } from './providers'
import { User } from './schemas'
import type { CallbacksOptions, CookiesOptions } from './types'

export { createActionURL, setEnvDefaults }

/**
 * this handles the request and builds up the internal state
 * for routing/handling the request with the appropriate action+provider
 *
 * @param request
 * @param config
 * @returns
 */
export async function CourseBuilder(
	request: Request,
	config: CourseBuilderConfig,
): Promise<Response> {
	setLogger(config.logger, config.debug)

	const internalRequest = await toInternalRequest(request, config)
	if (!internalRequest) {
		return Response.json('Bad request', { status: 400 })
	}

	const warningsOrError = assertConfig(internalRequest, config)

	if (Array.isArray(warningsOrError)) {
		warningsOrError.forEach(logger.warn)
	} else if (warningsOrError) {
		logger.error(warningsOrError)
		return Response.json('Internal Server Error', { status: 500 })
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
		if (request.method === 'POST' && internalRequest.action === 'session')
			return Response.json(null, { status: 400 })
		return Response.json(`something broke: ${(e as Error).message}`, {
			status: 400,
		})
	}
}

export interface CourseBuilderConfig {
	callbacks?: Partial<CallbacksOptions>
	adapter?: CourseBuilderAdapter
	providers: Provider[]
	debug?: boolean
	basePath?: string
	logger?: LoggerInstance
	cookies?: Partial<CookiesOptions>
	useSecureCookies?: boolean
	inngest?: Inngest
	getCurrentUser?: () => Promise<User | null>
	authConfig: AuthConfig
	baseUrl: string
}

export { formatPricesForProduct } from './lib/pricing/format-prices-for-product'
export { checkForPaymentSuccessWithoutPurchase } from './lib/pricing/purchase-page-utils'
