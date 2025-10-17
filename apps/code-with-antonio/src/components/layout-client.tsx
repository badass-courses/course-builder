'use client'

import { type SaleBannerData } from '@/lib/sale-banner'

import { cn } from '@coursebuilder/ui/utils/cn'

import Navigation from './navigation'
import Footer from './navigation/footer'
import SaleBanner from './navigation/sale-banner'

/**
 * Client-side layout component that handles container styling and side patterns
 */
export default function LayoutClient({
	children,
	withContainer = false,
	className,
	saleBannerData,
	isCommerceEnabled = false,
}: {
	children: React.ReactNode
	withContainer?: boolean
	className?: string
	saleBannerData?: SaleBannerData | null
	isCommerceEnabled?: boolean
}) {
	return (
		<div
			className={cn(
				'',

				className,
			)}
		>
			<Navigation />
			{saleBannerData && (
				<SaleBanner
					saleBannerData={saleBannerData}
					isCommerceEnabled={isCommerceEnabled}
				/>
			)}
			<main
				className={cn('', {
					container: withContainer,
				})}
			>
				{children}
			</main>
			<Footer />
		</div>
	)
}
