import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import { imageService } from '@unpic/astro/service'
import { defineConfig, envField } from 'astro/config'

import coursebuilder from '@coursebuilder/astro'
import auth from '@coursebuilder/auth-astro'

// https://astro.build/config
export default defineConfig({
	site: 'https://codetv.dev',
	output: 'server',
	trailingSlash: 'never',
	integrations: [
		mdx(),
		react(),
		sitemap(),
		auth({ configFile: './auth.config.ts' }),
		coursebuilder({ configFile: './coursebuilder.config.ts' }),
	],
	image: {
		domains: ['img.clerk.com'],
		service: imageService({
			placeholder: 'none',
		}),
	},
	adapter: vercel(),
	security: {
		checkOrigin: false,
	},
	vite: {
		resolve: {
			alias: {
				crypto: 'node:crypto',
			},
		},
	},
	env: {
		schema: {
			COURSEBUILDER_URL: envField.string({
				access: 'public',
				context: 'server',
			}),
			AUTH_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			GITHUB_CLIENT_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			GITHUB_CLIENT_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			DATABASE_URL: envField.string({
				access: 'secret',
				context: 'server',
			}),
			NETLIFY_PERSONAL_ACCESS_TOKEN: envField.string({
				access: 'secret',
				context: 'server',
			}),
			PUBLIC_CLERK_PUBLISHABLE_KEY: envField.string({
				access: 'public',
				context: 'client',
			}),
			PUBLIC_CLERK_SIGN_IN_URL: envField.string({
				access: 'public',
				context: 'client',
			}),
			PUBLIC_CLERK_SIGN_UP_URL: envField.string({
				access: 'public',
				context: 'client',
			}),
			CLERK_SECRET_KEY: envField.string({
				access: 'secret',
				context: 'server',
			}),
			STRIPE_SECRET_KEY: envField.string({
				access: 'secret',
				context: 'server',
			}),
			STRIPE_WEBHOOK_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			TIER_SILVER_PRICE_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			TIER_GOLD_PRICE_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			TIER_PLATINUM_PRICE_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			MUX_JWT_SIGNING_KEY: envField.string({
				access: 'secret',
				context: 'server',
			}),
			// MUX_JWT_PRIVATE_KEY: envField.string({
			// 	access: 'secret',
			// 	context: 'server',
			// }),
			MUX_TOKEN_ID: envField.string({
				access: 'secret',
				context: 'server',
			}),
			MUX_TOKEN_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			CLOUDINARY_CLOUD_NAME: envField.string({
				access: 'secret',
				context: 'server',
			}),
			CLOUDINARY_API_KEY: envField.string({
				access: 'secret',
				context: 'server',
			}),
			CLOUDINARY_API_SECRET: envField.string({
				access: 'secret',
				context: 'server',
			}),
			CONVERTKIT_API_KEY: envField.string({
				access: 'secret',
				context: 'server',
			}),
			CONVERTKIT_SECRET_KEY: envField.string({
				access: 'secret',
				context: 'server',
			}),
			SANITY_SECRET_TOKEN: envField.string({
				access: 'secret',
				context: 'server',
			}),
			DISCORD_BOT_TOKEN: envField.string({
				access: 'secret',
				context: 'server',
			}),
			PUBLIC_ALGOLIA_API_KEY: envField.string({
				access: 'public',
				context: 'client',
			}),
			PUBLIC_ALGOLIA_APP_ID: envField.string({
				access: 'public',
				context: 'client',
			}),
		},
	},
})
