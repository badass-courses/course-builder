import * as React from 'react'

import { FormattedPrice } from '@coursebuilder/core/types'

import { cn } from '../cn'

export interface PriceBreakdownProps {
	price: FormattedPrice
	showDetails?: boolean
	className?: string
}

/**
 * Displays a detailed price breakdown with support for fixed and percentage discounts.
 *
 * Shows the original price, applied discounts (fixed amount or percentage), upgrade credits,
 * and the final calculated price.
 *
 * @param price - The formatted price object containing pricing details
 * @param showDetails - Whether to show detailed discount breakdown (default: true)
 * @param className - Additional CSS classes to apply
 */
export function PriceBreakdown({
	price,
	showDetails = true,
	className = '',
}: PriceBreakdownProps) {
	const {
		fullPrice,
		calculatedPrice,
		appliedDiscountType,
		appliedFixedDiscount,
		appliedMerchantCoupon,
		fixedDiscountForUpgrade,
	} = price

	const hasDiscount = calculatedPrice < fullPrice
	const discountAmount = fullPrice - calculatedPrice

	return (
		<div className={cn('space-y-2', className)}>
			{/* Original Price */}
			{hasDiscount && (
				<div className="text-muted-foreground flex justify-between text-sm">
					<span>Original Price</span>
					<span className="line-through">${fullPrice.toFixed(2)}</span>
				</div>
			)}

			{/* Discount Breakdown */}
			{showDetails && hasDiscount && (
				<div className="space-y-1">
					{/* Fixed Discount */}
					{appliedDiscountType === 'fixed' && appliedFixedDiscount && (
						<div className="flex justify-between text-sm text-green-600 dark:text-green-400">
							<span>Discount ({appliedMerchantCoupon?.type})</span>
							<span>-${appliedFixedDiscount.toFixed(2)}</span>
						</div>
					)}

					{/* Percentage Discount */}
					{['percentage', 'ppp', 'bulk'].includes(
						appliedDiscountType || '',
					) && (
						<div className="flex justify-between text-sm text-green-600 dark:text-green-400">
							<span>
								Discount (
								{appliedMerchantCoupon?.percentageDiscount
									? `${(appliedMerchantCoupon.percentageDiscount * 100).toFixed(0)}%`
									: appliedDiscountType}
								)
							</span>
							<span>-${discountAmount.toFixed(2)}</span>
						</div>
					)}

					{/* Upgrade Discount */}
					{fixedDiscountForUpgrade > 0 && (
						<div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
							<span>Upgrade Credit</span>
							<span>-${fixedDiscountForUpgrade.toFixed(2)}</span>
						</div>
					)}
				</div>
			)}

			{/* Final Price */}
			<div className="border-border flex justify-between border-t pt-2 text-lg font-bold">
				<span>Total</span>
				<span>${calculatedPrice.toFixed(2)}</span>
			</div>
		</div>
	)
}
