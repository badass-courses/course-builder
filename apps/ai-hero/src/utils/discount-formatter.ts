/**
 * Format discount amount for display based on coupon type
 *
 * @param coupon - Coupon object with discount information
 * @param coupon.amountDiscount - Fixed amount discount in cents (optional)
 * @param coupon.percentageDiscount - Percentage discount as decimal (e.g., 0.25 for 25%) (optional)
 * @returns Formatted discount string (e.g., "$20.00" or "25%")
 *
 * @example
 * ```ts
 * // Fixed discount
 * formatDiscount({ amountDiscount: 2000 }) // "$20.00"
 *
 * // Percentage discount
 * formatDiscount({ percentageDiscount: 0.25 }) // "25%"
 * ```
 */
export function formatDiscount(coupon: {
	amountDiscount?: number | null
	percentageDiscount?: number | string | null
}): string {
	const hasFixedDiscount = coupon.amountDiscount && coupon.amountDiscount > 0

	if (hasFixedDiscount && coupon.amountDiscount) {
		// Fixed amount discount (in cents, convert to dollars)
		const discountValue = coupon.amountDiscount / 100
		return `$${discountValue.toFixed(2)}`
	} else {
		// Percentage discount
		const percentOff = Number(coupon.percentageDiscount) * 100
		return `${percentOff}%`
	}
}
