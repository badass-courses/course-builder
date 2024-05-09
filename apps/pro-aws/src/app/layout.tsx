import '@/styles/globals.css'

import * as React from 'react'
import { Metadata } from 'next'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import config from '@/config'
import { env } from '@/env.mjs'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { patron, r } from '@/utils/load-fonts'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import HolyLoader from 'holy-loader'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

import { Toaster } from '@coursebuilder/ui/primitives/toaster'

export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_URL),
	title: 'ProAWS by Adam Elmore',
	description: config.description,
	icons: [
		{ rel: 'icon', sizes: 'any', url: '/favicon.ico' },
		{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
	],
	twitter: {
		card: 'summary_large_image',
	},
	openGraph: {
		images: [
			{
				url: config.openGraph.images[0]!.url,
			},
		],
	},
}

const isGoogleAnalyticsAvailable =
	env.NODE_ENV !== 'development' && env.NEXT_PUBLIC_GOOGLE_ANALYTICS

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<Providers>
			<html lang="en" suppressHydrationWarning>
				<HolyLoader color="#f28f5a" height="0.1rem" speed={250} />
				<AxiomWebVitals />
				<body className={`relative ${patron.variable} ${r.variable} font-sans`}>
					<Toaster />
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
							forcedTheme="dark"
							defaultTheme="dark"
							enableSystem={false}
							disableTransitionOnChange
						>
							<NextSSRPlugin
								/**
								 * The `extractRouterConfig` will extract **only** the route configs from the
								 * router to prevent additional information from being leaked to the client. The
								 * data passed to the client is the same as if you were to fetch
								 * `/api/uploadthing` directly.
								 */
								routerConfig={extractRouterConfig(ourFileRouter)}
							/>
							<Navigation />
							{children}
						</ThemeProvider>
					</TRPCReactProvider>
					{isGoogleAnalyticsAvailable && (
						<GoogleAnalytics gaId={env.NEXT_PUBLIC_GOOGLE_ANALYTICS!} />
					)}
				</body>
			</html>
		</Providers>
	)
}
