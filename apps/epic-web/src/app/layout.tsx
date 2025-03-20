import '@/styles/globals.css'

import * as React from 'react'
import { Inter } from 'next/font/google'
import { Providers } from '@/app/providers'
import Navigation from '@/components/navigation'

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
})

export const metadata = {
	title: 'Epic Web Builder',
	description: 'Build Epic Web content',
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<body className={`font-sans ${inter.variable}`}>
				<Providers>
					<div className="flex min-h-screen w-full flex-col">
						<Navigation />
						<main className="flex min-h-[calc(100vh-3.5rem)] flex-col">
							{children}
						</main>
					</div>
				</Providers>
			</body>
		</html>
	)
}
