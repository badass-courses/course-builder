import * as React from 'react'
import { ProductPricingFeatures } from '@/components/commerce/product-pricing-features'

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
			className="relative w-full border-b border-l px-5 pb-5"
			product={product}
			couponId={couponId}
			country={commerceProps.country}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
			{...commerceProps}
		>
			<Pricing.Product className="w-full">
				<Pricing.ProductImage />
				<Pricing.Details className="px-0">
					<Pricing.Name className="mb-2" />
					<Pricing.LiveQuantity />
					<Pricing.Price />
					<Pricing.TeamToggle />
					<Pricing.TeamQuantityInput />
					<Pricing.BuyButton />
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.SaleCountdown className="py-4" />
					<Pricing.PPPToggle />
				</Pricing.Details>
			</Pricing.Product>
			<ProductPricingFeatures product={product} />
		</Pricing.Root>
	)
}
