/**
 * > **caution**
 * > `@coursebuilder/astro` is currently experimental. Be aware of breaking changes between versions.
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
import type { APIContext } from 'astro'
import coursebuilderConfig from 'coursebuilder:config'

import { CourseBuilder } from '@coursebuilder/core'
import { setEnvDefaults } from '@coursebuilder/core/utils/env'

import type { FullCoursebuilderConfig } from './config'

function reqWithEnvURL(request: Request) {
	return new Request(request, {
		headers: request.headers,
	})
}

function initCourseBuilder(config: FullCoursebuilderConfig) {
	setEnvDefaults(import.meta.env, config)
	return config
}

export function Coursebuilder(config: FullCoursebuilderConfig = coursebuilderConfig) {
	console.log('Coursebuilder', config)
	setEnvDefaults(import.meta.env, config)
	const handler = async ({ request }: APIContext) => {
		const isWebhook = ['stripe-signature'].every((prop: string) => {
			return prop in request.headers
		})

		const newReq = reqWithEnvURL(request)
		return CourseBuilder(newReq, config)
	}

	return {
		GET: handler,
		POST: handler,
		coursebuilder: initCourseBuilder(config),
	}
}
