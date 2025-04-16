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
	ctaLabel?: string
}> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	quantityAvailable,
	ctaLabel = 'Join Now',
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	const isSoldOut = product.type === 'live' && (quantityAvailable || 0) <= 0

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
					<Pricing.LiveQuantity className="bg-primary/10 text-primary px-2 pb-1" />
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
					<Pricing.BuyButton className="from-primary relative my-3 w-auto min-w-[260px] origin-bottom rounded-md bg-gradient-to-bl to-indigo-800 px-6 py-6 text-lg font-bold !text-white shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
						{isSoldOut ? 'Sold Out' : ctaLabel}
					</Pricing.BuyButton>
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.SaleCountdown className="[&_p]:pb-0" />
					<Pricing.PPPToggle />
				</Pricing.Details>
			</Pricing.Product>
		</Pricing.Root>
	)
}
