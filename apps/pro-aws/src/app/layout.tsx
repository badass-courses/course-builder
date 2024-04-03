import '@/styles/globals.css'

import * as React from 'react'
import { Metadata } from 'next'
import Script from 'next/script'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import { ThemeProvider } from '@/components/theme-provider'
import config from '@/config'
import { env } from '@/env.mjs'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { patron } from '@/utils/load-fonts'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

export const metadata: Metadata = {
	title: 'Pro AWS by Adam Elmore',
	description: config.description,
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
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
			<html lang="en" suppressHydrationWarning={true}>
				<AxiomWebVitals />
				<body className={`dark relative ${patron.variable} font-sans`}>
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
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
