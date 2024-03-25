import {
	GetServerSidePropsContext,
	NextApiRequest,
	NextApiResponse,
} from 'next'
import { headers } from 'next/headers'
import { NextMiddleware, NextRequest, NextResponse } from 'next/server'

import {
	CourseBuilder,
	CourseBuilderConfig,
	createActionURL,
} from '@coursebuilder/core'

import { reqWithEnvURL } from './env'
import { AppRouteHandlerFn } from './types'

export interface NextCourseBuilderConfig extends CourseBuilderConfig {}

export type WithCourseBuilderArgs =
	| [NextCourseBuilderRequest, any]
	| [AppRouteHandlerFn]
	| [NextApiRequest, NextApiResponse]
	| [GetServerSidePropsContext]
	| []

function isReqWrapper(arg: any): arg is AppRouteHandlerFn {
	return typeof arg === 'function'
}

export function initCourseBuilder(
	config:
		| NextCourseBuilderConfig
		| ((request: NextRequest | undefined) => NextCourseBuilderConfig),
	onLazyLoad?: (config: NextCourseBuilderConfig) => void,
) {
	if (typeof config === 'function') {
		return (...args: WithCourseBuilderArgs) => {
			if (!args.length) {
				// React Server Components
				const _headers = headers()
				const _config = config(undefined) // Review: Should we pass headers() here instead?
				onLazyLoad?.(_config)

				return getSession(_headers, _config).then((r) => r.json())
			}

			if (args[0] instanceof Request) {
				// middleware.ts inline
				// export { auth as default } from "auth"
				const req = args[0]
				const ev = args[1]
				const _config = config(req)
				onLazyLoad?.(_config)

				// args[0] is supposed to be NextRequest but the instanceof check is failing.
				return handleCourseBuilder([req, ev], _config)
			}

			if (isReqWrapper(args[0])) {
				// middleware.ts wrapper/route.ts
				// import { auth } from "auth"
				// export default auth((req) => { console.log(req.auth) }})
				const userMiddlewareOrRoute = args[0]
				return async (...args: Parameters<AppRouteHandlerFn>) => {
					return handleCourseBuilder(
						args,
						config(args[0]),
						userMiddlewareOrRoute,
					)
				}
			}
			// API Routes, getServerSideProps
			const request = 'req' in args[0] ? args[0].req : args[0]
			const response: any = 'res' in args[0] ? args[0].res : args[1]
			// @ts-expect-error -- request is NextRequest
			const _config = config(request)
			onLazyLoad?.(_config)

			// @ts-expect-error -- request is NextRequest
			return getSession(new Headers(request.headers), _config).then(
				async (authResponse) => {
					const auth = await authResponse.json()

					for (const cookie of authResponse.headers.getSetCookie())
						if ('headers' in response)
							response.headers.append('set-cookie', cookie)
						else response.appendHeader('set-cookie', cookie)

					return auth satisfies any | null
				},
			)
		}
	}
	return (...args: WithCourseBuilderArgs) => {
		if (!args.length) {
			const _headers = headers()
			return getSession(_headers, config)
		}

		if (args[0] instanceof Request) {
			// middleware.ts inline
			// export { auth as default } from "auth"
			const req = args[0]
			const ev = args[1]
			return handleCourseBuilder([req, ev], config)
		}
	}
}

async function getSession(headers: Headers, config: CourseBuilderConfig) {
	// TODO what's a coursebuilder session?

	const url = createActionURL(
		'session',
		// @ts-expect-error `x-forwarded-proto` is not nullable, next.js sets it by default
		headers.get('x-forwarded-proto'),
		headers,
		process.env,
		config.basePath,
	)

	const request = new Request(url, {
		headers: { cookie: headers.get('cookie') ?? '' },
	})

	return CourseBuilder(request, config)
}

async function handleCourseBuilder(
	args: Parameters<NextMiddleware | AppRouteHandlerFn>,
	config: CourseBuilderConfig,
	userRoute?: AppRouteHandlerFn,
) {
	const request = reqWithEnvURL(args[0])
	const sessionResponse = await getSession(request.headers, config)
	const coursebuilder = await sessionResponse.json()

	let response: any = NextResponse.next?.()

	const finalResponse = new Response(response?.body, response)

	for (const cookie of sessionResponse.headers.getSetCookie())
		finalResponse.headers.append('set-cookie', cookie)

	return finalResponse
}

export interface NextCourseBuilderRequest extends NextRequest {
	coursebuilder: any | null
}
