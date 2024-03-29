import '@/styles/globals.css'

import * as React from 'react'
import { Inter } from 'next/font/google'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { patron } from '@/utils/load-fonts'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

export const metadata = {
	title: 'Pro AWS by Adam Elmore',
	description: 'Course building workflows in the cloud 🌦️',
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
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
				<body className={`${patron.variable} dark font-sans`} id="layout">
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<div key="1" className="relative ">
								{/*<div className="sm:px-5 lg:px-8">*/}
								{/*	<Navigation />*/}
								{/*</div>*/}
								<main className="flex min-h-[calc(100vh-var(--nav-height))] flex-col">
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
