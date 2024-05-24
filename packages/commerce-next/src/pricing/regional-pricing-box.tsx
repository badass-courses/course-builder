import * as React from 'react'

import { MinimalMerchantCoupon } from '@coursebuilder/core/types'

const getNumericValue = (
	value: string | number | Partial<{ toNumber: () => number }> | undefined,
): number => {
	if (typeof value === 'string') {
		return Number(value)
	} else if (typeof value === 'number') {
		return value
	} else if (typeof value?.toNumber === 'function') {
		return value.toNumber()
	} else {
		return 0
	}
}

type RegionalPricingBoxProps = {
	availablePPPCoupon?: {
		country?: string | undefined
		percentageDiscount: number | string
	} | null
	appliedPPPCoupon: MinimalMerchantCoupon | null
	setMerchantCoupon: (coupon: any) => void
	index: number
	setAutoApplyPPP: (apply: boolean) => void
	purchaseToUpgradeExists: boolean
}

export const RegionalPricingBox: React.FC<
	React.PropsWithChildren<RegionalPricingBoxProps>
> = ({
	availablePPPCoupon,
	appliedPPPCoupon,
	setMerchantCoupon,
	index,
	setAutoApplyPPP,
	purchaseToUpgradeExists,
}) => {
	const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

	if (!availablePPPCoupon?.country) {
		console.error('No country found for PPP coupon', { availablePPPCoupon })
		return null
	}

	const countryCode = availablePPPCoupon.country
	const country = regionNames.of(countryCode)
	const percentageDiscount = getNumericValue(
		availablePPPCoupon.percentageDiscount,
	)
	const percentOff = Math.floor(percentageDiscount * 100)

	// if we are upgrading a Core(PPP) to a Bundle(PPP) and the PPP coupon is
	// valid and auto-applied then we hide the checkbox to reduce confusion.
	const hideCheckbox = purchaseToUpgradeExists

	return (
		<div data-ppp-container={index}>
			<div data-ppp-header="">
				<strong>
					We noticed that you&apos;re from{' '}
					<img
						src={`https://hardcore-golick-433858.netlify.app/image?code=${countryCode}`}
						alt={`${country} flag`}
						width={18}
						height={14}
					/>{' '}
					{country}. To help facilitate global learning, we are offering
					purchasing power parity pricing.
				</strong>
				<p>
					Please note that you will only be able to view content from within{' '}
					{country}, and no bonuses will be provided.
				</p>
				{!hideCheckbox && <p>If that is something that you need:</p>}
			</div>
			{!hideCheckbox && (
				<label>
					<input
						type="checkbox"
						checked={Boolean(appliedPPPCoupon)}
						onChange={() => {
							setAutoApplyPPP(false)
							if (appliedPPPCoupon) {
								setMerchantCoupon(undefined)
							} else {
								setMerchantCoupon(availablePPPCoupon as any)
							}
						}}
					/>
					<span>Activate {percentOff}% off with regional pricing</span>
				</label>
			)}
		</div>
	)
}
