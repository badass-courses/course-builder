import { AdapterError } from '../errors'
import { CourseBuilderConfig } from '../index'
import { CallbacksOptions, InternalOptions, RequestInternal } from '../types'
import * as cookie from './utils/cookie.js'
import { logger, LoggerInstance } from './utils/logger'
import { merge } from './utils/merge'
import parseProviders from './utils/providers'

interface InitParams {
	url: URL
	courseBuilderOptions: CourseBuilderConfig
	providerId?: string
	action: InternalOptions['action']
	isPost: boolean
	cookies: RequestInternal['cookies']
}

export async function init({
	url,
	courseBuilderOptions,
	providerId,
	action,
	isPost,
	cookies: reqCookies,
}: InitParams): Promise<{
	options: InternalOptions
	cookies: cookie.Cookie[]
}> {
	const { providers, provider } = parseProviders({
		providers: courseBuilderOptions.providers,
		url,
		providerId,
		options: courseBuilderOptions,
	})

	const maxAge = 30 * 24 * 60 * 60

	const options: InternalOptions = {
		debug: false,
		pages: {},
		...courseBuilderOptions,
		url,
		action,
		// @ts-expect-errors
		provider,
		cookies: merge(
			{},
			cookie.defaultCookies(
				courseBuilderOptions.useSecureCookies ?? url.protocol === 'https:',
			),
			courseBuilderOptions.cookies || {},
			reqCookies,
		),
		providers,
		adapter: adapterErrorHandler(courseBuilderOptions.adapter, logger),
		callbacks: { ...defaultCallbacks, ...courseBuilderOptions.callbacks },
		logger,
		getCurrentUser: courseBuilderOptions.getCurrentUser,
	}

	// Convert request cookies to Cookie[] format for actions
	const cookies: cookie.Cookie[] = Object.entries(reqCookies || {})
		.filter((entry): entry is [string, string] => typeof entry[1] === 'string')
		.map(([name, value]) => ({
			name,
			value,
			options: {},
		}))

	return { options, cookies }
}

type Method = (...args: any[]) => Promise<any>

export const defaultCallbacks: CallbacksOptions = {
	session(payload) {
		return payload
	},
}

function adapterErrorHandler(
	adapter: CourseBuilderConfig['adapter'],
	logger: LoggerInstance,
) {
	if (!adapter) return

	return Object.keys(adapter).reduce<any>((acc, name) => {
		acc[name] = async (...args: any[]) => {
			try {
				logger.debug(`adapter_${name}`, { args })
				const method: Method = adapter[name as keyof Method]
				return await method(...args)
			} catch (e) {
				const error = new AdapterError(e as Error)
				logger.error(error)
				throw error
			}
		}
		return acc
	}, {})
}
