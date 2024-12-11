import '@/styles/globals.css'

import * as React from 'react'
import { Metadata } from 'next'
import { Gabarito } from 'next/font/google'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import Footer from '@/components/app/footer'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import config from '@/config'
import { courseBuilderAdapter } from '@/db'
import { env } from '@/env.mjs'
import { FeedbackInsert } from '@/feedback-widget/feedback-insert'
import { getProduct } from '@/lib/products-query'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import HolyLoader from 'holy-loader'
import { AxiomWebVitals } from 'next-axiom'
import { extractRouterConfig } from 'uploadthing/server'

import { CouponProvider } from '@coursebuilder/commerce-next/coupons/coupon-context'
import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import { Toaster } from '@coursebuilder/ui/primitives/toaster'

export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_URL),
	title: `${config.defaultTitle} by ${config.author}`,
	description: config.description,
	icons: [
		{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
		{ rel: 'icon', sizes: 'any', url: '/favicon.ico' },
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

const gabarito = Gabarito({
	variable: '--gabarito',
	subsets: ['latin'],
})

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<Providers>
			<html lang="en" suppressHydrationWarning>
				<HolyLoader color="#DEC09D" height="0.1rem" speed={250} />
				<AxiomWebVitals />
				<body
					id="layout"
					className={`relative ${gabarito.variable} antialised font-sans`}
				>
					<Toaster />
					<FeedbackInsert />
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
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
							<Footer />
						</ThemeProvider>
					</TRPCReactProvider>
					{isGoogleAnalyticsAvailable && (
						<GoogleAnalytics gaId={env.NEXT_PUBLIC_GOOGLE_ANALYTICS!} />
					)}
					<div
						className="pointer-events-none fixed inset-0 z-50 h-full w-full"
						style={{
							backgroundImage: 'url(/assets/noise.png)',
							opacity: 0.06,
							backgroundRepeat: 'repeat',
							backgroundSize: 109,
						}}
					/>
				</body>
			</html>
		</Providers>
	)
}
