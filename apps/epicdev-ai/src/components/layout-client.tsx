'use client'

import { useParams } from 'next/navigation'

import { cn } from '@coursebuilder/ui/utils/cn'

import Navigation from './navigation'
import Footer from './navigation/footer'

/**
 * Client-side layout component that handles container styling and side patterns
 */
export default function LayoutClient({
	children,
	withContainer = false,
	className,
	navigationClassName,
}: {
	children: React.ReactNode
	withContainer?: boolean
	className?: string
	navigationClassName?: string
}) {
	return (
		<div className="flex min-h-screen flex-col">
			<Navigation
				className={navigationClassName}
				withContainer={withContainer}
			/>
			<div
				className={cn(
					'',
					{
						'mx-auto w-full max-w-[1200px] flex-grow px-6 sm:px-10':
							withContainer,
					},
					className,
				)}
			>
				<div className="bg-linear-to-r absolute inset-x-0 -top-6 -z-10 h-12 -rotate-3 from-violet-300 via-pink-300 to-sky-300 blur-3xl dark:from-violet-500/10 dark:via-pink-500/10 dark:to-sky-500/10" />
				<div
					style={{
						background: 'url("/noise.png") repeat',
						backgroundSize: '120px',
					}}
					className="absolute inset-0 -z-10 hidden h-80 w-full opacity-[0.15] mix-blend-overlay dark:flex"
				/>
				<div className="from-background to-background/0 bg-linear-to-t absolute inset-0 -z-10 hidden h-80 w-full opacity-100 dark:flex" />
				<div className="">{children}</div>
			</div>
			<Footer />
		</div>
	)
}
