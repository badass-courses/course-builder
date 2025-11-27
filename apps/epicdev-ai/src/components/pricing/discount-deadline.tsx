'use client'

/**
 * Display discount deadline date in MDX content
 * Receives coupon expiration date from server
 */
export function DiscountDeadline({
	format = 'long',
	expires,
}: {
	format?: 'short' | 'long'
	expires: Date | string | null
}) {
	if (!expires) return null

	const dateObj = typeof expires === 'string' ? new Date(expires) : expires
	const options: Intl.DateTimeFormatOptions =
		format === 'long'
			? { month: 'long', day: 'numeric', year: 'numeric' }
			: { month: 'short', day: 'numeric' }

	return <>{dateObj.toLocaleDateString('en-US', options)}</>
}
