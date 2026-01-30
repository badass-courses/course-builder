import '@/styles/globals.css'

import * as React from 'react'
import { Metadata } from 'next'
import {
	IM_Fell_Double_Pica,
	IM_Fell_DW_Pica,
	Inter,
	Libre_Caslon_Display,
	Libre_Caslon_Text,
} from 'next/font/google'
import { FeedbackInsert } from '@/components/feedback-widget/feedback-insert'
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

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
})

const imFellDoublePica = IM_Fell_Double_Pica({
	subsets: ['latin'],
	variable: '--font-im-fell-double-pica',
	adjustFontFallback: false,
	weight: '400',
})

const imFellDwPica = IM_Fell_DW_Pica({
	subsets: ['latin'],
	variable: '--font-im-fell-dw-pica',
	adjustFontFallback: false,
	weight: '400',
})

const libreCaslonDisplay = Libre_Caslon_Display({
	subsets: ['latin'],
	variable: '--font-libre-caslon-display',
	adjustFontFallback: false,
	weight: ['400'],
})

const libreCaslonText = Libre_Caslon_Text({
	subsets: ['latin'],
	variable: '--font-libre-caslon-text',
	adjustFontFallback: false,
	weight: ['400', '700'],
})

export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_URL),
	title: `DEV`,
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
				<AxiomWebVitals />
				<body
					id="layout"
					className={`relative overflow-x-hidden ${inter.variable} ${imFellDoublePica.variable} ${imFellDwPica.variable} ${libreCaslonDisplay.variable} ${libreCaslonText.variable} antialised font-sans`}
				>
					<Toaster />
					<FeedbackInsert />
					<TRPCReactProvider>
						<Party />
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem={true}
							disableTransitionOnChange
						>
							<NuqsAdapter>
								<HolyLoader
									color="var(--primary)"
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
							</NuqsAdapter>
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
