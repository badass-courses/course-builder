/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createMDX from '@next/mdx'
import { withAxiom } from 'next-axiom'

import { env } from './src/env.mjs'

await import('./src/env.mjs')

const withMDX = createMDX({
	options: {},
})

/** @type {import("next").NextConfig} */
const config = {
	experimental: {
		mdxRs: true,
		ppr: 'incremental',
	},
	serverExternalPackages: ['@sentry/nextjs', 'liquidjs'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'image.mux.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: env.NEXT_PUBLIC_URL.replace('https://', ''),
				port: '',
			},
		],
	},
	pageExtensions: ['mdx', 'ts', 'tsx'],
	transpilePackages: ['@coursebuilder/ui', 'next-mdx-remote', 'shiki'],
	redirects: async () => {
		return [
			{
				source: '/events/workshops/mcp/fundamentals',
				destination: '/mcp-fundamentals',
				statusCode: 308,
			},
			{
				source: '/events/workshops/mcp/advanced',
				destination: '/advanced-mcp-features',
				statusCode: 308,
			},
			{
				source: '/events/workshops/mcp',
				destination: '/mcp-workshops',
				statusCode: 308,
			},
		]
	},
}

export default withAxiom(withMDX(config))
