'use client'

import type { SaleBannerData } from '@/lib/sale-banner'

/**
 * Display discount deadline date in MDX content
 * Receives already-fetched sale data from server
 */
export function DiscountDeadline({
	format = 'long',
	saleData,
}: {
	format?: 'short' | 'long'
	saleData: SaleBannerData | null
}) {
	if (!saleData?.expires) return null

	const dateObj = new Date(saleData.expires)
	const options: Intl.DateTimeFormatOptions =
		format === 'long'
			? { month: 'long', day: 'numeric', year: 'numeric' }
			: { month: 'short', day: 'numeric' }

	return <>{dateObj.toLocaleDateString('en-US', options)}</>
}
