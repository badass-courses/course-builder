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
	withNavigation = true,
	withFooter = true,
}: {
	children: React.ReactNode
	withContainer?: boolean
	className?: string
	withNavigation?: boolean
	withFooter?: boolean
}) {
	return (
		<div
			className={cn(
				'',
				{
					'relative mx-auto w-full max-w-[1200px] px-2 sm:px-4': withContainer,
				},
				className,
			)}
		>
			{withContainer && (
				<div className="bg-stripes absolute bottom-0 left-0 top-0 flex h-full min-h-screen w-2 flex-col sm:w-4" />
			)}
			<div className="border-x">
				{withNavigation && <Navigation />}
				{children}
				{withFooter && <Footer />}
			</div>
			{withContainer && (
				<div className="bg-stripes absolute bottom-0 right-0 top-0 flex h-full min-h-screen w-2 flex-col sm:w-4" />
			)}
		</div>
	)
}
