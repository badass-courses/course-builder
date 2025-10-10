import * as React from 'react'

import { FormattedPrice } from '@coursebuilder/core/types'

import { cn } from '../cn'

export interface DiscountBadgeProps {
	price: FormattedPrice
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

/**
 * Shows discount type and amount as a badge.
 *
 * Displays different formats based on discount type:
 * - Fixed discounts show "Save $XX"
 * - Percentage discounts show "XX% OFF"
 * - PPP discounts show "XX% OFF (Regional Pricing)"
 * - Bulk discounts show "XX% OFF (Bulk Discount)"
 *
 * @param price - The formatted price object containing discount details
 * @param size - Badge size: 'sm', 'md', or 'lg' (default: 'md')
 * @param className - Additional CSS classes to apply
 */
export function DiscountBadge({
	price,
	size = 'md',
	className = '',
}: DiscountBadgeProps) {
	const {
		fullPrice,
		calculatedPrice,
		appliedDiscountType,
		appliedFixedDiscount,
		appliedMerchantCoupon,
	} = price

	if (calculatedPrice >= fullPrice) return null

	const discountAmount = fullPrice - calculatedPrice
	const discountPercent = ((discountAmount / fullPrice) * 100).toFixed(0)

	const sizeClasses = {
		sm: 'text-xs px-2 py-1',
		md: 'text-sm px-3 py-1.5',
		lg: 'text-base px-4 py-2',
	}

	const getBadgeText = () => {
		switch (appliedDiscountType) {
			case 'fixed':
				return `Save $${discountAmount.toFixed(0)}`
			case 'percentage':
				return `${discountPercent}% OFF`
			case 'ppp':
				return `${discountPercent}% OFF (Regional Pricing)`
			case 'bulk':
				return `${discountPercent}% OFF (Bulk Discount)`
			default:
				return `${discountPercent}% OFF`
		}
	}

	return (
		<span
			className={cn(
				'inline-flex items-center rounded-md bg-green-100 font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400',
				sizeClasses[size],
				className,
			)}
		>
			{getBadgeText()}
		</span>
	)
}
