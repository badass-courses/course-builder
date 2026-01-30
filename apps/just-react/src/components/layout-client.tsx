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
	isCommerceEnabled = true,
	withFooter = true,
	withSearch = false,
}: {
	children: React.ReactNode
	withContainer?: boolean
	withFooter?: boolean
	className?: string
	saleBannerData?: SaleBannerData | null
	isCommerceEnabled?: boolean
	withSearch?: boolean
}) {
	return (
		<div className={cn('')}>
			{saleBannerData && (
				<SaleBanner
					saleBannerData={saleBannerData}
					isCommerceEnabled={isCommerceEnabled}
				/>
			)}
			<Navigation withSearch={withSearch} />
			<div className="min-h-fullscreen flex flex-col justify-between">
				<main
					className={cn('text-foreground', className, {
						container: withContainer,
					})}
				>
					{children}
				</main>
				{withFooter && <Footer />}
			</div>
		</div>
	)
}
