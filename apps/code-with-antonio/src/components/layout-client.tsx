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
	isCommerceEnabled,
}: {
	children: React.ReactNode
	withContainer?: boolean
	className?: string
	saleBannerData: SaleBannerData | null
	isCommerceEnabled: boolean
}) {
	return (
		<div
			className={cn(
				'',
				{
					container: withContainer,
				},
				className,
			)}
		>
			<Navigation />
			<SaleBanner
				saleBannerData={saleBannerData}
				isCommerceEnabled={isCommerceEnabled}
			/>
			{children}
			<Footer />
		</div>
	)
}
