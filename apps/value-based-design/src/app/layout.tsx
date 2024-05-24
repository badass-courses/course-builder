import '@/styles/globals.css'

import * as React from 'react'
import { Suspense } from 'react'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import { Layout } from '@/components/layout'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { getProduct } from '@/lib/products-query'
import { getCouponForCode } from '@/lib/props-for-commerce'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { l } from '@/utils/load-fonts'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

import { CouponProvider } from '@coursebuilder/commerce-next/coupons/coupon-context'
import { cn } from '@coursebuilder/ui/utils/cn'

export const metadata = {
	title: 'Value-Based Design',
	description: '',
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
				<body
					className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${l.variable}`}
				>
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
							defaultTheme="light"
							forcedTheme="light"
							enableSystem
							disableTransitionOnChange
						>
							<div key="1" className="flex min-h-screen w-full flex-col">
								{/* <Navigation /> */}
								<Layout>
									<NextSSRPlugin
										/**
										 * The `extractRouterConfig` will extract **only** the route configs from the
										 * router to prevent additional information from being leaked to the client. The
										 * data passed to the client is the same as if you were to fetch
										 * `/api/uploadthing` directly.
										 */
										routerConfig={extractRouterConfig(ourFileRouter)}
									/>
									<CouponProvider
										getCouponForCode={getCouponForCode}
										getProduct={getProduct}
									>
										{children}
									</CouponProvider>
								</Layout>
							</div>
						</ThemeProvider>
					</TRPCReactProvider>
				</body>
			</html>
		</Providers>
	)
}
