import { CourseBuilderConfig } from '../../index'
import { CourseBuilderAction } from '../../types'
import { logger } from './logger.js'

/** Set default env variables on the config object */
export function setEnvDefaults(envObject: any, config: CourseBuilderConfig) {
	try {
		const url = envObject.COURSEBUILDER_URL
		if (url && !config.basePath) config.basePath = new URL(url).pathname
	} catch {
	} finally {
		config.basePath ??= `/coursebuilder`
	}

	config.providers = config.providers.map((p) => {
		const finalProvider = typeof p === 'function' ? p({}) : p
		const ID = finalProvider.id.toUpperCase()
		if (finalProvider.type === 'transcription') {
			finalProvider.apiKey ??= envObject[`COURSEBUILDER_${ID}_API_KEY`]
		}
		return finalProvider
	})
}

export function createActionURL(
	action: CourseBuilderAction,
	protocol: string,
	headers: Headers,
	envObject: any,
	basePath?: string,
): URL {
	let envUrl = envObject.COURSEBUILDER_URL

	let url: URL
	if (envUrl) {
		url = new URL(envUrl)
		if (basePath && basePath !== '/' && url.pathname !== '/') {
			logger.debug(
				url.pathname === basePath
					? 'env-url-basepath-redundant'
					: 'env-url-basepath-mismatch',
			)
			url.pathname = '/'
		}
	} else {
		const detectedHost = headers.get('x-forwarded-host') ?? headers.get('host')
		const detectedProtocol =
			headers.get('x-forwarded-proto') ?? protocol ?? 'https'

		url = new URL(`${detectedProtocol}://${detectedHost}`)
	}

	// remove trailing slash
	const sanitizedUrl = url.toString().replace(/\/$/, '')

	if (basePath) {
		// remove leading and trailing slash
		const sanitizedBasePath = basePath?.replace(/(^\/|\/$)/g, '') ?? ''
		return new URL(`${sanitizedUrl}/${sanitizedBasePath}/${action}`)
	}
	return new URL(`${sanitizedUrl}/${action}`)
}
