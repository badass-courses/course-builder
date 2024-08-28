import * as React from 'react'

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

export const EventPricingWidget: React.FC<{
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
					{/* <Pricing.Name /> */}
					<Pricing.LiveQuantity className="border-2 bg-transparent pt-1.5" />
					<Pricing.Price />
					<Pricing.TeamToggle />
					<Pricing.TeamQuantityInput />
					<Pricing.BuyButton className="border-2 text-white" />
					<Pricing.SaleCountdown />
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.PPPToggle />
				</Pricing.Details>
			</Pricing.Product>
		</Pricing.Root>
	)
}
