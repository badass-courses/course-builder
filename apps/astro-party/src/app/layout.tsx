import '@/styles/globals.css'

import * as React from 'react'
import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import { Body } from '@/components/app/body'
import { Layout } from '@/components/layout'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { getProduct } from '@/lib/products-query'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { cooperFont, cooperGoodtimeFont } from '@/utils/load-fonts'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import HolyLoader from 'holy-loader'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

import { CouponProvider } from '@coursebuilder/commerce-next/coupons/coupon-context'
import { getCouponForCode } from '@coursebuilder/commerce-next/pricing/props-for-commerce'

const fredokaFont = Fredoka({
	subsets: ['latin'],
	variable: '--font-fredoka',
})

export const metadata: Metadata = {
	title: config.defaultTitle,
	description: '',
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
	openGraph: {
		images: [
			{
				url: env.NEXT_PUBLIC_URL + '/card@2x.jpg',
			},
		],
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<Providers>
			<html lang="en" suppressHydrationWarning={true}>
				<HolyLoader color="#009A52" height="0.1rem" speed={250} />
				<AxiomWebVitals />
				<Body
					className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${cooperFont.variable} ${cooperGoodtimeFont.variable} ${fredokaFont.variable}`}
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
								<Navigation />
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
									getCouponForCode={async (couponCodeOrId: string | null) => {
										'use server'
										return getCouponForCode(
											couponCodeOrId,
											[],
											courseBuilderAdapter,
										)
									}}
									getProduct={getProduct}
								>
									{children}
								</CouponProvider>
							</div>
						</ThemeProvider>
					</TRPCReactProvider>
				</Body>
			</html>
		</Providers>
	)
}
