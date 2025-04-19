/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createMDX from '@next/mdx'
import { withAxiom } from 'next-axiom'

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
		],
	},
	pageExtensions: ['mdx', 'ts', 'tsx'],
	transpilePackages: ['@coursebuilder/ui', 'next-mdx-remote', 'shiki'],
}

export default withAxiom(withMDX(config))
