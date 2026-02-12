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
	withNavContainer = true,
	withFooterContainer = true,
	className,
	saleBannerData,
	isCommerceEnabled = true,
	withFooter = true,
	withNavigation = true,
}: {
	children: React.ReactNode
	withContainer?: boolean
	withFooter?: boolean
	className?: string
	saleBannerData?: SaleBannerData | null
	isCommerceEnabled?: boolean
	withNavContainer?: boolean
	withFooterContainer?: boolean
	withNavigation?: boolean
}) {
	return (
		<div className={cn('w-full')}>
			{saleBannerData && (
				<SaleBanner
					saleBannerData={saleBannerData}
					isCommerceEnabled={isCommerceEnabled}
				/>
			)}
			{withNavigation && (
				<Navigation withContainer={withNavContainer || withContainer} />
			)}
			<main
				className={cn('min-h-[calc(100dvh-var(--nav-height))]', className, {
					container: withContainer,
				})}
			>
				{children}
			</main>
			{withFooter && (
				<Footer withContainer={withFooterContainer || withContainer} />
			)}
		</div>
	)
}
