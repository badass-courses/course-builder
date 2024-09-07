import '@/styles/globals.css'

import * as React from 'react'
import { Suspense } from 'react'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Party } from '@/app/_components/party'
import { Providers } from '@/app/_components/providers'
import Footer from '@/components/app/footer'
import Navigation from '@/components/app/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { getProduct } from '@/lib/products-query'
import { getCouponForCode } from '@/lib/props-for-commerce'
import { TRPCReactProvider } from '@/trpc/react'
import { ourFileRouter } from '@/uploadthing/core'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { AxiomWebVitals } from 'next-axiom'
import { Toaster } from 'react-hot-toast'
import { extractRouterConfig } from 'uploadthing/server'

import { CouponProvider } from '@coursebuilder/commerce-next/coupons/coupon-context'

const dmSans = DM_Sans({
	subsets: ['latin'],
	variable: '--font-dmsans',
	weight: ['400', '500', '700'],
})

const jetBransMono = JetBrains_Mono({
	subsets: ['latin'],
	variable: '--font-jetbrainsmono',
})

export const metadata = {
	title: 'Epic Web',
	description:
		'Learn full-stack web development with Kent C. Dodds and the Epic Web instructors. Learn TypeScript, React, Node.js, and more through hands-on workshops.',
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<AxiomWebVitals />
			<body
				className={`${dmSans.variable} ${jetBransMono.variable} font-sans antialiased`}
			>
				<TRPCReactProvider>
					<Providers>
						<Party />
						<ThemeProvider
							attribute="class"
							enableSystem={false}
							defaultTheme="dark"
							disableTransitionOnChange={true}
						>
							<div key="1" className="flex min-h-screen w-full flex-col">
								<Navigation />
								<Toaster
									position="top-center"
									toastOptions={{
										style: {
											background: '#363636',
											color: '#fff',
										},
										iconTheme: {
											primary: '#fde68a',
											secondary: '#000',
										},
									}}
								/>
								<div className="flex grow flex-col">
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
								</div>
								<Footer />
							</div>
						</ThemeProvider>
					</Providers>
				</TRPCReactProvider>
			</body>
		</html>
	)
}
