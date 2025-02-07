import { Auth } from '@auth/core'
import type { Session } from '@auth/core/types'
import { defineMiddleware } from 'astro:middleware'
import authConfig from 'auth:config'

export async function getSession(
	req: Request,
	options = authConfig,
): Promise<Session | null> {
	// @ts-ignore
	options.secret ??= import.meta.env.AUTH_SECRET
	options.trustHost ??= true

	const url = new URL(`${options.prefix}/session`, req.url)
	const response = await Auth(
		new Request(url, { headers: req.headers }),
		options,
	)
	const { status = 200 } = response

	const data = await response.json()

	if (!data || !Object.keys(data).length) return null
	if (status === 200) return data
	throw new Error(data.message)
}

const PROTECTED_ROUTE_PATTERN = /^(?!.*\/(?:sign-up|sign-in)\/?$)\/dashboard.*$/

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = new URL(context.request.url).pathname

	if (PROTECTED_ROUTE_PATTERN.test(pathname)) {
		const session = await getSession(context.request)
		context.locals.session = session
		context.locals.currentUser = () => session?.user
	} else {
		context.locals.session = null
		context.locals.currentUser = () => null
	}

	return next()
})
