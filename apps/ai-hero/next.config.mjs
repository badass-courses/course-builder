/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createMDX from '@next/mdx'
import { withSentryConfig } from '@sentry/nextjs'
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
		turbopackFileSystemCacheForDev: true,
		serverComponentsHmrCache: true,
		optimizePackageImports: ['lucide-react', '@coursebuilder/ui', 'shiki'],
	},
	serverExternalPackages: ['@sentry/nextjs', 'liquidjs'],
	allowedDevOrigins: ['localhost:3000', '*.ngrok.app'],
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
	async redirects() {
		return [
			{
				source:
					'/(cohorts/)?build-your-own-ai-personal-assistant-in-type-script(.*)',
				destination:
					'/cohorts/build-your-own-ai-personal-assistant-in-typescript',
				permanent: true,
			},
			{
				source: '/workshops/ai-sdk-v5-crash-course',
				destination: '/workshops/ai-sdk-v6-crash-course',
				permanent: true,
			},
			{
				source: '/11-tips-for-ai-coding-with-ralph-wiggum',
				destination: '/tips-for-ai-coding-with-ralph-wiggum',
				permanent: true,
			},
		]
	},
	async rewrites() {
		return {
			beforeFiles: [
				// Short-circuit /sitemap.md to prevent /:slug from catching it
				{
					source: '/sitemap.md',
					destination: '/sitemap.md',
					has: [
						{
							type: 'header',
							key: 'accept',
							value: '(.*text/markdown.*)',
						},
					],
				},
				// Posts/Lists: Accept: text/markdown → /md/[slug]
				{
					source: '/:slug',
					destination: '/md/:slug',
					has: [
						{
							type: 'header',
							key: 'accept',
							value: '(.*text/markdown.*)',
						},
					],
				},
				// Workshops
				{
					source: '/workshops/:module/:lesson',
					destination: '/md/workshops/:module/:lesson',
					has: [
						{
							type: 'header',
							key: 'accept',
							value: '(.*text/markdown.*)',
						},
					],
				},
				// Tutorials
				{
					source: '/tutorials/:module/:lesson',
					destination: '/md/tutorials/:module/:lesson',
					has: [
						{
							type: 'header',
							key: 'accept',
							value: '(.*text/markdown.*)',
						},
					],
				},
			],
		}
	},
}

export default withAxiom(withMDX(config))
