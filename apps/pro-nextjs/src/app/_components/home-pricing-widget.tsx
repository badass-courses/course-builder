'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import type { PricingOptions } from '@coursebuilder/commerce-next/pricing/pricing-props'
import type { CommerceProps } from '@coursebuilder/commerce-next/utils/commerce-props'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import type { FormattedPrice } from '@coursebuilder/core/types'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export const PricingWidget: React.FC<{
	product: Product
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	pricingWidgetOptions?: Partial<PricingOptions>
}> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	quantityAvailable,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return (
		<Pricing.Root
			className="relative w-full"
			product={product}
			couponId={couponId}
			country={commerceProps.country}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
			{...commerceProps}
		>
			<Pricing.Purchased className="gap-5">
				<Pricing.ProductImage />
				<p className="text-lg font-semibold">Already Purchased</p>
				<Pricing.BuyMoreSeatsToggle />
				<Pricing.BuyMoreSeats />
			</Pricing.Purchased>
			<Pricing.Product className="w-full">
				<Pricing.ProductImage />
				<Pricing.Details className="px-0">
					<Pricing.Name />
					<Pricing.LiveQuantity />
					<Pricing.Price />
					<Pricing.TeamToggle className="mt-3" />
					<Pricing.TeamQuantityInput />
					<Pricing.BuyButton className="via-primary bg-gradient-to-b from-blue-500 to-blue-700 shadow" />
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.PPPToggle className="mt-5" />
					<div className="mt-5 w-full">
						<strong className="mb-3 inline-flex w-full text-left font-mono text-sm font-bold uppercase tracking-wide text-gray-700">
							Includes
						</strong>
						<ul className="flex flex-col gap-2">
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4" />
								Over 90 Lessons
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4" />
								Lifetime Access
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4" />
								Customizable invoice
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4" />
								English Transcripts & Subtitles
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4" />
								Progress Tracking
							</li>
						</ul>
					</div>
				</Pricing.Details>
			</Pricing.Product>
		</Pricing.Root>
	)
}
