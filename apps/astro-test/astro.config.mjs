// @ts-check
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import auth from 'auth-astro'

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
	integrations: [auth()],
	output: 'server',
})
