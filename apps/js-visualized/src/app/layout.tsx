import '@/styles/globals.css'

import * as React from 'react'
import { Metadata, Viewport } from 'next'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import config from '@/config'
import { env } from '@/env.mjs'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { GeistSans } from 'geist/font/sans'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_URL),
	title: `${config.defaultTitle} by ${config.author}`,
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

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<Providers>
			<html lang="en" suppressHydrationWarning={true}>
				<AxiomWebVitals />
				<body className={`${GeistSans.className} antialiased`}>
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<div key="1" className="flex min-h-screen w-full flex-col">
								<Navigation />
								<main className="flex min-h-screen flex-col pt-[--nav-height-mobile] sm:pt-[--nav-height]">
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
								</main>
							</div>
						</ThemeProvider>
					</TRPCReactProvider>
				</body>
			</html>
		</Providers>
	)
}
