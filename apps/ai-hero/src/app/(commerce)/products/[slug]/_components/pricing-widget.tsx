import * as React from 'react'

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
			className="relative w-full"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product className="w-full">
				{/* <Pricing.ProductImage /> */}
				<Pricing.Details className="pt-0">
					<Pricing.Name />
					<Pricing.LiveQuantity />
					<div className="flex items-center gap-1">
						<Pricing.Price />
						{product.type === 'membership' && (
							<span className="text-xl opacity-80">/ year</span>
						)}
					</div>
					{pricingWidgetOptions?.allowTeamPurchase && (
						<>
							<Pricing.TeamToggle />
							<Pricing.TeamQuantityInput />
						</>
					)}
					<Pricing.BuyButton className="mt-4">Join Now</Pricing.BuyButton>
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.SaleCountdown className="py-4" />
					<Pricing.PPPToggle />
				</Pricing.Details>
			</Pricing.Product>
		</Pricing.Root>
	)
}
