import '@/styles/globals.css'

import * as React from 'react'
import { Metadata } from 'next'
import { DM_Serif_Text, Inter } from 'next/font/google'
import { FeedbackInsert } from '@/components/feedback-widget/feedback-insert'
import LayoutClient from '@/components/layout-client'
import Navigation from '@/components/navigation'
import Footer from '@/components/navigation/footer'
import { Party } from '@/components/party'
import { Providers } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { getProduct } from '@/lib/products-query'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import HolyLoader from 'holy-loader'
import { AxiomWebVitals } from 'next-axiom'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { extractRouterConfig } from 'uploadthing/server'

import { CouponProvider } from '@coursebuilder/commerce-next/coupons/coupon-context'
import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import { Toaster } from '@coursebuilder/ui/primitives/toaster'

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

const isGoogleAnalyticsAvailable =
	env.NODE_ENV !== 'development' && env.NEXT_PUBLIC_GOOGLE_ANALYTICS

const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-sans',
})

const dmSerifText = DM_Serif_Text({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-serif',
	weight: '400',
})

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<Providers>
			<html lang="en" suppressHydrationWarning>
				<AxiomWebVitals />
				<body
					id="layout"
					className={`relative ${inter.variable} ${dmSerifText.variable} antialised font-sans`}
				>
					<Toaster />
					<FeedbackInsert />
					<TRPCReactProvider>
						<NuqsAdapter>
							<Party />
							<ThemeProvider
								attribute="class"
								defaultTheme="dark"
								enableSystem={true}
								disableTransitionOnChange
							>
								<HolyLoader
									color="hsl(var(--foreground))"
									height="0.15rem"
									speed={250}
								/>
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
							</ThemeProvider>
						</NuqsAdapter>
					</TRPCReactProvider>
					{isGoogleAnalyticsAvailable && (
						<GoogleAnalytics gaId={env.NEXT_PUBLIC_GOOGLE_ANALYTICS!} />
					)}
				</body>
			</html>
		</Providers>
	)
}
