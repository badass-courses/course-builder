'use client'

import * as React from 'react'

import { FormattedPrice } from '@coursebuilder/core/types'

import { cn } from '../cn'

export interface CouponInputProps {
	onApplyCoupon: (couponId: string) => Promise<void>
	currentPrice: FormattedPrice | null
	className?: string
}

/**
 * Input field for applying coupon codes.
 *
 * Displays an input field and apply button when no coupon is applied.
 * Shows a confirmation message with discount details when a coupon is active.
 *
 * @param onApplyCoupon - Callback function to apply a coupon code
 * @param currentPrice - Current formatted price with coupon information
 * @param className - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * <CouponInput
 *   onApplyCoupon={handleApplyCoupon}
 *   currentPrice={formattedPrice}
 * />
 * ```
 */
export function CouponInput({
	onApplyCoupon,
	currentPrice,
	className,
}: CouponInputProps) {
	const [couponCode, setCouponCode] = React.useState('')
	const [isApplying, setIsApplying] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const handleApply = async () => {
		if (!couponCode.trim()) return

		setIsApplying(true)
		setError(null)

		try {
			await onApplyCoupon(couponCode)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Invalid coupon code')
		} finally {
			setIsApplying(false)
		}
	}

	const hasCoupon = currentPrice?.appliedMerchantCoupon

	return (
		<div className={cn('', className)}>
			{hasCoupon ? (
				<div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
					<div className="flex items-center space-x-2">
						<span className="font-medium text-green-600 dark:text-green-400">
							Coupon Applied
						</span>
						{currentPrice.appliedDiscountType === 'fixed' &&
							currentPrice.appliedFixedDiscount && (
								<span className="text-sm text-gray-600 dark:text-gray-400">
									(${currentPrice.appliedFixedDiscount.toFixed(2)} off)
								</span>
							)}
						{['percentage', 'ppp', 'bulk'].includes(
							currentPrice.appliedDiscountType || '',
						) &&
							currentPrice.appliedMerchantCoupon?.percentageDiscount && (
								<span className="text-sm text-gray-600 dark:text-gray-400">
									(
									{(
										currentPrice.appliedMerchantCoupon.percentageDiscount * 100
									).toFixed(0)}
									% off)
								</span>
							)}
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<div className="flex space-x-2">
						<input
							type="text"
							value={couponCode}
							onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
							placeholder="Enter coupon code"
							className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
							disabled={isApplying}
						/>
						<button
							onClick={handleApply}
							disabled={isApplying || !couponCode.trim()}
							className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isApplying ? 'Applying...' : 'Apply'}
						</button>
					</div>
					{error && (
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					)}
				</div>
			)}
		</div>
	)
}
