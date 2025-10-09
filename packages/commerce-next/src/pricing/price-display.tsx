import * as React from 'react'
import { QueryStatus } from '@tanstack/react-query'

import { FormattedPrice } from '@coursebuilder/core/types'
import { formatUsd } from '@coursebuilder/core/utils/format-usd'

import { cn } from '../cn'
import { usePriceCheck } from './pricing-check-context'

export type PriceDisplayProps = {
	status: 'success' | 'pending' | 'error'
	formattedPrice?: FormattedPrice | null
	className?: string
}
export const PriceDisplay = ({
	status,
	formattedPrice,
	className = '',
}: PriceDisplayProps) => {
	const { isDiscount } = usePriceCheck()

	const appliedMerchantCoupon = formattedPrice?.appliedMerchantCoupon

	const fullPrice = formattedPrice?.fullPrice

	const percentOff = appliedMerchantCoupon
		? Math.floor(+(appliedMerchantCoupon.percentageDiscount ?? 0) * 100)
		: formattedPrice && isDiscount(formattedPrice)
			? Math.floor(
					((formattedPrice.unitPrice - formattedPrice.calculatedPrice) /
						formattedPrice.unitPrice) *
						100,
				)
			: 0

	const percentOffLabel =
		appliedMerchantCoupon && `${percentOff}% off of $${fullPrice}`

	return (
		<div data-price-container={status} className={className}>
			{status === 'pending' ? (
				<div data-loading-price="">
					<span className="sr-only">Loading price</span>
					<Spinner aria-hidden="true" className="text-foreground h-8 w-8" />
				</div>
			) : (
				<>
					<sup aria-hidden="true">US</sup>
					<div aria-live="polite" data-price="">
						{formattedPrice?.calculatedPrice &&
							formatUsd(formattedPrice?.calculatedPrice).dollars}
						<span className="sup text-sm" aria-hidden="true">
							{formattedPrice?.calculatedPrice &&
								formatUsd(formattedPrice?.calculatedPrice).cents}
						</span>
						{Boolean(appliedMerchantCoupon || isDiscount(formattedPrice)) && (
							<>
								<div aria-hidden="true" data-price-discounted="">
									<div data-full-price={fullPrice}>{'$' + fullPrice}</div>
									<div data-percent-off={percentOff}>Save {percentOff}%</div>
								</div>
								<div className="sr-only">
									{appliedMerchantCoupon?.type === 'bulk' ? (
										<div>Team discount.</div>
									) : null}{' '}
									{percentOffLabel}
								</div>
							</>
						)}
					</div>
				</>
			)}
		</div>
	)
}
const Spinner: React.FunctionComponent<{
	className?: string
}> = ({ className = 'w-8 h-8', ...rest }) => (
	<svg
		className={cn('animate-spin', className)}
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		{...rest}
	>
		<title>Loading</title>
		<circle
			opacity={0.25}
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			strokeWidth="4"
		/>
		<path
			opacity={0.75}
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		/>
	</svg>
)
