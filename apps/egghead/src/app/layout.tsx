import '@/styles/globals.css'
import '@/styles/login.css'

import * as React from 'react'
import { Inter } from 'next/font/google'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { env } from '@/env.mjs'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { extractRouterConfig } from 'uploadthing/server'

import { Toaster } from '@coursebuilder/ui/primitives/toaster'

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
})

export const metadata = {
	title: 'egghead Post Builder',
	description: 'build egghead posts',
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
				<body className={`font-sans ${inter.variable}`}>
					<TRPCReactProvider>
						<NuqsAdapter>
							<Party />
							<Toaster />
							<ThemeProvider
								attribute="class"
								defaultTheme="dark"
								enableSystem={false}
								disableTransitionOnChange
							>
								<div key="1" className="flex min-h-screen w-full flex-col">
									<Navigation />
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
						</NuqsAdapter>
					</TRPCReactProvider>
				</body>
			</html>
		</Providers>
	)
}
