import { dirname, join } from 'node:path'
import type { AstroIntegration } from 'astro'

import { virtualConfigModule, type CoursebuilderConfig } from './config'

export default (config: CoursebuilderConfig = {}): AstroIntegration => ({
	name: 'coursebuilder-astro',
	hooks: {
		'coursebuilder:config:setup': async ({
			config: coursebuilderConfig,
			injectRoute,
			injectScript,
			updateConfig,
			logger,
		}) => {
			updateConfig({
				vite: {
					plugins: [virtualConfigModule(config.configFile)],
					optimizeDeps: { exclude: ['coursebuilder:config'] },
				},
			})

			config.prefix ??= '/api/coursebuilder'

			if (config.injectEndpoints !== false) {
				const currentDir = dirname(import.meta.url.replace('file://', ''))
				const entrypoint = join(`${currentDir}/api/[...coursebuilder].ts`)
				injectRoute({
					pattern: `${config.prefix}/[...coursebuilder]`,
					entrypoint,
				})
			}

			if (!coursebuilderConfig.adapter) {
				logger.error('No Adapter found, please make sure you provide one in your Astro config')
			}
			const edge = ['@astrojs/vercel/edge', '@astrojs/cloudflare'].includes(
				coursebuilderConfig.adapter.name
			)

			if (
				(!edge && globalThis.process && process.versions.node < '19.0.0') ||
				(process.env.NODE_ENV === 'development' && edge)
			) {
				injectScript(
					'page-ssr',
					`import crypto from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = crypto;
if (typeof globalThis.crypto.subtle === "undefined") globalThis.crypto.subtle = crypto.webcrypto.subtle;
if (typeof globalThis.crypto.randomUUID === "undefined") globalThis.crypto.randomUUID = crypto.randomUUID;
`
				)
			}
		},
	},
})
