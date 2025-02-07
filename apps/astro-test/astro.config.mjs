// @ts-check
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'

import coursebuilder from '@coursebuilder/astro'
import auth from '@coursebuilder/auth-astro'

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
	integrations: [
		auth({ configFile: './auth.config.ts' }),
		coursebuilder({ configFile: './coursebuilder.config.ts' }),
	],
	output: 'server',
	vite: {
		resolve: {
			alias: {
				crypto: 'node:crypto',
			},
		},
	},
})
