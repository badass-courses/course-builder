import * as React from 'react'
import { twMerge } from 'tailwind-merge'

import Footer from './footer'

export async function Layout({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div className={`relative font-sans antialiased`} id="layout">
			<div
				className={twMerge(
					'flex h-full min-h-[calc(100svh-4rem)] flex-grow flex-col',
					className,
				)}
			>
				{children}
			</div>
			<Footer />
		</div>
	)
}
