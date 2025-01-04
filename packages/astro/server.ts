/**
 * > **caution**
 * > `@coursebuilder/astro` is currently experimental. Be aware of breaking changes between versions.
 *
 *
 * Course Builder Astro is the official Astro integration for Course Builder.
 * It provides a simple way to add course functionality to your Astro site in a few lines of code.
 *
 * ## Installation
 *
 * `@coursebuilder/astro` requires building your site in `server` mode with a platform adapter like `@astrojs/node`.
 * ```js
 * // astro.config.mjs
 * export default defineConfig({
 *   output: "server",
 *   adapter: node({
 *     mode: 'standalone'
 *   })
 * });
 * ```
 *
 * ```bash npm2yarn2pnpm
 * npm install @coursebuilder/astro
 * ```
 */
import { Auth } from '@auth/core'
import type { AuthAction } from '@auth/core/types'
import type { APIContext } from 'astro'
import coursebuilderConfig from 'coursebuilder:config'
import { parseString } from 'set-cookie-parser'

const actions: AuthAction[] = [
	'providers',
	'session',
	'csrf',
	'signin',
	'signout',
	'callback',
	'verify-request',
	'error',
]

function CoursebuilderHandler(prefix: string, options = coursebuilderConfig) {
	return async ({ cookies, request }: APIContext) => {
		const url = new URL(request.url)
		const action = url.pathname.slice(prefix.length + 1).split('/')[0] as AuthAction

		if (!actions.includes(action) || !url.pathname.startsWith(prefix + '/')) return

		const res = await Auth(request, options)
		if (['callback', 'signin', 'signout'].includes(action)) {
			// Properly handle multiple Set-Cookie headers (they can't be concatenated in one)
			const getSetCookie = res.headers.getSetCookie()
			if (getSetCookie.length > 0) {
				getSetCookie.forEach((cookie) => {
					const { name, value, ...options } = parseString(cookie)
					// Astro's typings are more explicit than @types/set-cookie-parser for sameSite
					cookies.set(name, value, options as Parameters<(typeof cookies)['set']>[2])
				})
				res.headers.delete('Set-Cookie')
			}
		}
		return res
	}
}

/**
 * Creates a set of Astro endpoints for authentication.
 *
 * @example
 * ```ts
 * export const { GET, POST } = AstroAuth({
 *   providers: [
 *     GitHub({
 *       clientId: process.env.GITHUB_ID!,
 *       clientSecret: process.env.GITHUB_SECRET!,
 *     }),
 *   ],
 *   debug: false,
 * })
 * ```
 * @param config The configuration for authentication providers and other options.
 * @returns An object with `GET` and `POST` methods that can be exported in an Astro endpoint.
 */
export function Coursebuilder(options = coursebuilderConfig) {
	// @ts-ignore
	const { COURSEBUILDER_SECRET, COURSEBUILDER_TRUST_HOST, VERCEL, NODE_ENV } = import.meta.env

	options.secret ??= COURSEBUILDER_SECRET
	options.trustHost ??= !!(COURSEBUILDER_TRUST_HOST ?? VERCEL ?? NODE_ENV !== 'production')

	const { prefix = '/api/coursebuilder', ...coursebuilderOptions } = options

	const handler = CoursebuilderHandler(prefix, coursebuilderOptions)
	return {
		async GET(context: APIContext) {
			return await handler(context)
		},
		async POST(context: APIContext) {
			return await handler(context)
		},
	}
}
