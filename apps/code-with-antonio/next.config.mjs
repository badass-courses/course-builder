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
	},
	serverExternalPackages: ['@sentry/nextjs', 'liquidjs', 'sanitize-html'],
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
			// ------------------------------------------------------------
			// Projects -> Workshops
			// ------------------------------------------------------------
			// Lovable Clone
			{
				source: '/projects/vibe',
				destination: '/workshops/build-and-deploy-a-lovable-clone',
				permanent: true,
			},
			// Cursor Clone
			{
				source: '/projects/polaris',
				destination: '/workshops/build-and-deploy-a-cursor-clone',
				permanent: true,
			},
			// AI Automation SaaS
			{
				source: '/projects/nodebase',
				destination: '/workshops/build-and-deploy-an-ai-automation-saas',
				permanent: true,
			},
			// B2B SaaS AI Support Platform (Echo)
			{
				source: '/projects/echo',
				destination:
					'/workshops/build-and-deploy-a-b2b-saas-ai-support-platform',
				permanent: true,
			},
			// SaaS AI Agent Platform (Meet AI)
			{
				source: '/projects/meet-ai',
				destination: '/workshops/build-and-deploy-a-saas-ai-agent-platform',
				permanent: true,
			},
			// Multi-Tenant E-Commerce
			{
				source: '/projects/multitenant-ecommerce',
				destination:
					'/workshops/build-a-multi-tenant-e-commerce-with-nextjs-tailwind-v4-stripe-connect',
				permanent: true,
			},
			// Youtube Clone
			{
				source: '/projects/youtube-clone',
				destination: '/workshops/youtube-clone',
				permanent: true,
			},
			// Canva Clone
			{
				source: '/projects/canva-clone',
				destination: '/workshops/build-a-canva-clone',
				permanent: true,
			},
			// Finance Platform
			{
				source: '/projects/finance-saas',
				destination: '/workshops/build-a-finance-platform',
				permanent: true,
			},
			// Duolingo Clone
			{
				source: '/projects/duolingo-clone',
				destination: '/workshops/duolingo-clone',
				permanent: true,
			},
			// Miro Clone
			{
				source: '/projects/miro-clone',
				destination: '/workshops/build-a-real-time-miro-clone',
				permanent: true,
			},
			// Next Auth v5 Advanced Guide
			{
				source: '/projects/auth-masterclass',
				destination: '/workshops/next-auth-v5-advanced-guide',
				permanent: true,
			},
			// Twitch Clone
			{
				source: '/projects/twitch-clone',
				destination: '/workshops/twitch-clone',
				permanent: true,
			},
			// Trello Clone
			{
				source: '/projects/trello-clone',
				destination: '/workshops/trello-clone',
				permanent: true,
			},
			// ------------------------------------------------------------
			// YouTube redirects (old projects)
			// ------------------------------------------------------------
			// Notes App
			{
				source: '/projects/notes-app',
				destination: 'https://www.youtube.com/watch?v=0OaDyjB9Ib8',
				permanent: true,
			},
			// LMS Platform
			{
				source: '/projects/lms-platform',
				destination: 'https://youtu.be/Big_aFLmekI',
				permanent: true,
			},
			// Team Chat Platform (Discord Clone)
			{
				source: '/projects/team-chat-platform',
				destination: 'https://youtu.be/ZbX4Ok9YX94',
				permanent: true,
			},
			// AI Companion
			{
				source: '/projects/ai-companion',
				destination: 'https://youtu.be/PjYWpd7xkaM',
				permanent: true,
			},
			// AI SaaS
			{
				source: '/projects/ai-saas',
				destination: 'https://youtu.be/ffJ38dBzrlY',
				permanent: true,
			},
			// E-Commerce + Dashboard
			{
				source: '/projects/ecommerce',
				destination: 'https://youtu.be/5miHyP6lExg',
				permanent: true,
			},
			// Music Platform (Spotify Clone)
			{
				source: '/projects/music-platform',
				destination: 'https://youtu.be/2aeMRB8LL4o',
				permanent: true,
			},
			// Chat Platform (Messenger Clone)
			{
				source: '/projects/chat-platform',
				destination: 'https://youtu.be/PGPGcKBpAk8',
				permanent: true,
			},
			// Reservation Platform (Airbnb Clone)
			{
				source: '/projects/reservation-platform',
				destination: 'https://youtu.be/c_-b_isI4vg',
				permanent: true,
			},
			// Social Media Platform (Threads Clone)
			{
				source: '/projects/social-media-platform',
				destination: 'https://youtu.be/ytkG7RT6SvU',
				permanent: true,
			},
			// Video Platform (Netflix Clone)
			{
				source: '/projects/video-platform',
				destination: 'https://youtu.be/mqUN4N2q4qY',
				permanent: true,
			},
			// REST API
			{
				source: '/projects/rest-api',
				destination: 'https://youtu.be/b8ZUb_Okxro',
				permanent: true,
			},
		]
	},
}

export default withAxiom(withMDX(config))
