import * as React from 'react'
import { Check } from 'lucide-react'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'

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
	hasPurchasedCurrentProduct?: boolean
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
			className="relative mb-5 w-full border-b pb-5"
			product={product}
			couponId={couponId}
			country={commerceProps.country}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
			{...commerceProps}
		>
			<Pricing.Product className="w-full">
				{/* <Pricing.ProductImage /> */}
				<Pricing.Details className="px-0">
					{/* <Pricing.Name /> */}
					<Pricing.LiveQuantity />
					<Pricing.Price />
					<Pricing.TeamToggle />
					<Pricing.TeamQuantityInput />
					<Pricing.BuyButton />
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.PPPToggle />
				</Pricing.Details>
			</Pricing.Product>
			<strong className="mb-3 inline-flex w-full text-left text-base font-semibold">
				Includes
			</strong>
			<ul className="flex w-full flex-col gap-2">
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
		</Pricing.Root>
	)
}
