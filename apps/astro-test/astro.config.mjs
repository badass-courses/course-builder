// @ts-check
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import auth from 'auth-astro'

import coursebuilder from '@coursebuilder/astro'

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
	integrations: [auth(), coursebuilder()],
	output: 'server',
})
