import * as React from 'react'

import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { Product } from '@coursebuilder/core/schemas'
import {
	CommerceProps,
	PricingData,
	PricingOptions,
} from '@coursebuilder/core/types'

import { useCoupon } from '../coupons/use-coupon'

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
			className="relative w-full"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product>
				<Pricing.ProductImage />
				<Pricing.Details>
					<Pricing.Name />
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
		</Pricing.Root>
	)
}
