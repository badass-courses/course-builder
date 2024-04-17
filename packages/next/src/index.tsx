import { headers } from 'next/headers.js'
import { NextRequest } from 'next/server.js'

import { CourseBuilder } from '@coursebuilder/core'
import { CheckoutParams } from '@coursebuilder/core/lib/pricing/stripe-checkout'
import { ResponseInternal } from '@coursebuilder/core/types'

import { reqWithEnvURL, setEnvDefaults } from './lib/env.js'
import { initCourseBuilder, NextCourseBuilderConfig } from './lib/index.js'

export default function NextCourseBuilder(
	config:
		| NextCourseBuilderConfig
		| ((request: NextRequest | undefined) => NextCourseBuilderConfig),
): NextCourseBuilderResult {
	if (typeof config === 'function') {
		const httpHandler = (req: NextRequest) => {
			const isWebhook = ['stripe-signature'].every(
				(prop: string) => prop in req.headers,
			)

			console.log('hmmm', { isWebhook, headers: req.headers })
			const _config = config(req)
			setEnvDefaults(_config)
			return CourseBuilder(reqWithEnvURL(req), _config)
		}
		return {
			handlers: { GET: httpHandler, POST: httpHandler } as const,
			coursebuilder: initCourseBuilder(config, (c) => setEnvDefaults(c)),
		}
	}
	setEnvDefaults(config)
	const httpHandler = async (req: NextRequest) => {
		const stripeHeader = headers().get('stripe-signature')
		const isWebhook = ['stripe-signature'].every((prop: string) => {
			console.log('prop', prop)
			return prop in req.headers
		})

		// const body = await req.text()

		const newReq = reqWithEnvURL(req)

		console.log('hah', { isWebhook, stripeHeader, config })
		const handler = CourseBuilder(newReq, config)

		// const body = await newReq.text()
		// console.log('body', body)

		return handler
	}
	return {
		handlers: { POST: httpHandler, GET: httpHandler } as const,
		coursebuilder: initCourseBuilder(config, (c) => setEnvDefaults(c)),
	}
}

export { type NextCourseBuilderConfig }

type AppRouteHandlers = Record<
	'GET' | 'POST',
	(req: NextRequest) => Promise<Response>
>

export interface NextCourseBuilderResult {
	handlers: AppRouteHandlers
	coursebuilder: any
}
