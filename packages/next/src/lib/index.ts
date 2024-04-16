import {
	GetServerSidePropsContext,
	NextApiRequest,
	NextApiResponse,
} from 'next'
import { headers } from 'next/headers.js'
import {
	NextFetchEvent,
	NextMiddleware,
	NextRequest,
	NextResponse,
} from 'next/server.js'

import {
	CourseBuilder,
	CourseBuilderConfig,
	createActionURL,
} from '@coursebuilder/core'
import {
	CourseBuilderAction,
	CourseBuilderSession,
} from '@coursebuilder/core/types'

import { reqWithEnvURL } from './env.js'
import { AppRouteHandlerFn } from './types.js'

export interface NextCourseBuilderConfig extends CourseBuilderConfig {
	callbacks?: CourseBuilderConfig['callbacks']
}

export type WithCourseBuilderArgs =
	| [NextCourseBuilderRequest, any]
	| [NextCourseBuilderMiddleware]
	| [AppRouteHandlerFn]
	| [NextApiRequest, NextApiResponse]
	| [GetServerSidePropsContext]
	| []

function isReqWrapper(
	arg: any,
): arg is NextCourseBuilderMiddleware | AppRouteHandlerFn {
	return typeof arg === 'function'
}

export type NextCourseBuilderMiddleware = (
	request: NextCourseBuilderRequest,
	event: NextFetchEvent,
) => ReturnType<NextMiddleware>

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
				return async (
					...args: Parameters<NextCourseBuilderMiddleware | AppRouteHandlerFn>
				) => {
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
				async (courseBuilderResponse) => {
					const coursebuilder = await courseBuilderResponse.json()

					for (const cookie of courseBuilderResponse.headers.getSetCookie())
						if ('headers' in response)
							response.headers.append('set-cookie', cookie)
						else response.appendHeader('set-cookie', cookie)

					return coursebuilder satisfies CourseBuilderSession | null
				},
			)
		}
	}
	return (...args: WithCourseBuilderArgs) => {
		if (!args.length) {
			// React Server Components
			return getSession(headers(), config).then((r) => r.json())
		}

		if (args[0] instanceof Request) {
			// middleware.ts inline
			// export { auth as default } from "auth"
			const req = args[0]
			const ev = args[1]
			return handleCourseBuilder([req, ev], config)
		}

		if (isReqWrapper(args[0])) {
			// middleware.ts wrapper/route.ts
			// import { auth } from "auth"
			// export default auth((req) => { console.log(req.auth) }})
			const userMiddlewareOrRoute = args[0]
			return async (
				...args: Parameters<NextCourseBuilderMiddleware | AppRouteHandlerFn>
			) => {
				return handleCourseBuilder(args, config, userMiddlewareOrRoute).then(
					(res) => {
						return res
					},
				)
			}
		}

		// API Routes, getServerSideProps
		const request = 'req' in args[0] ? args[0].req : args[0]
		const response: any = 'res' in args[0] ? args[0].res : args[1]

		return getSession(
			// @ts-expect-error
			new Headers(request.headers),
			config,
		).then(async (courseBuilderResponse) => {
			const coursebuilder = await courseBuilderResponse.json()

			for (const cookie of courseBuilderResponse.headers.getSetCookie())
				if ('headers' in response) response.headers.append('set-cookie', cookie)
				else response.appendHeader('set-cookie', cookie)

			return coursebuilder satisfies CourseBuilderSession | null
		})
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

	return CourseBuilder(request, {
		...config,
		callbacks: {
			...config.callbacks,
			async session(...args) {
				const session =
					// If the user defined a custom session callback, use that instead
					(await config.callbacks?.session?.(...args)) ?? {}
				return session satisfies CourseBuilderSession
			},
		},
	}) as Promise<Response>
}

async function handleCourseBuilder(
	args: Parameters<NextMiddleware | AppRouteHandlerFn>,
	config: CourseBuilderConfig,
	userMiddlewareOrRoute?: NextCourseBuilderMiddleware | AppRouteHandlerFn,
) {
	const request = reqWithEnvURL(args[0])
	const sessionResponse = await getSession(request.headers, config)
	const coursebuilder = await sessionResponse.json()

	let response: any = NextResponse.next?.()

	if (userMiddlewareOrRoute) {
		const augmentedReq = request as NextCourseBuilderRequest
		augmentedReq.coursebuilder = coursebuilder
		response =
			// @ts-expect-error
			(await userMiddlewareOrRoute(augmentedReq, args[1])) ??
			NextResponse.next()
	}

	const finalResponse = new Response(response?.body, response)

	for (const cookie of sessionResponse.headers.getSetCookie())
		finalResponse.headers.append('set-cookie', cookie)

	return finalResponse
}

function isSameAuthAction(
	requestPath: string,
	redirectPath: string,
	config: NextCourseBuilderConfig,
) {
	const action = redirectPath.replace(
		`${requestPath}/`,
		'',
	) as CourseBuilderAction

	return actions.has(action) && redirectPath === requestPath
}

const actions = new Set<CourseBuilderAction>([
	'webhook',
	'session',
	'srt',
	'checkout',
])

export interface NextCourseBuilderRequest extends NextRequest {
	coursebuilder: CourseBuilderSession | null
}
