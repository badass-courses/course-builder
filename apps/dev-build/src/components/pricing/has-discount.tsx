'use client'

import type { SaleBannerData } from '@/lib/sale-banner'

import type { Coupon } from '@coursebuilder/core/schemas'

/**
 * Conditionally render content based on whether there's an active discount
 * Shows content if there's a default coupon or sale data
 */
export function HasDiscount({
	defaultCoupon,
	saleData,
	children,
	fallback,
}: {
	defaultCoupon: Coupon | null
	saleData: SaleBannerData | null
	children: React.ReactNode
	fallback?: React.ReactNode
}) {
	// Only show discount if there's an active default coupon (site-wide sale)
	const hasDefaultCoupon = saleData || defaultCoupon
	return hasDefaultCoupon ? <>{children}</> : fallback ? <>{fallback}</> : null
}
