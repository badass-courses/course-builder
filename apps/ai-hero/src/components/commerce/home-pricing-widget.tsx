'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2Icon } from 'lucide-react'
import pluralize from 'pluralize'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'

import { ProductPricingFeatures } from './product-pricing-features'

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
			<Pricing.Product className="w-full">
				<Pricing.Purchased className="gap-1">
					<Link
						className="hover:underline"
						href={`/${pluralize(product?.resources?.[0]?.resource?.type)}/${product?.resources?.[0]?.resource?.fields?.slug}`}
					>
						<Pricing.ProductImage />
						<Pricing.Name>{product.name}</Pricing.Name>
					</Link>
					<div className="bg-muted mt-3 flex h-12 w-full items-center justify-center gap-2 rounded px-5 text-base font-medium">
						<CheckCircle2Icon className="h-4 w-4" />
						Purchased
					</div>
					<Pricing.BuyMoreSeats className="pt-5">
						<Pricing.TeamQuantityInput className="mb-0" label="Quantity" />
						<Pricing.Price className="scale-75" />
						<Pricing.BuyButton className="via-primary bg-linear-to-b mt-3 from-blue-500 to-blue-700 shadow-sm">
							Buy Additional Seats
						</Pricing.BuyButton>
					</Pricing.BuyMoreSeats>
					<Pricing.BuyMoreSeatsToggle className="text-primary h-12 w-full px-5 py-3 text-base" />
				</Pricing.Purchased>
				<Pricing.Details className="px-0 pt-0">
					<Pricing.ProductImage />
					<Pricing.Name />
					<Pricing.LiveQuantity />
					<Pricing.Price />
					<Pricing.TeamToggle className='[&_button>span[data-state="checked"]]:bg-primary mt-3' />
					<Pricing.TeamQuantityInput />
					<Pricing.BuyButton className="via-primary bg-linear-to-b from-blue-500 to-blue-700 shadow-sm" />
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.SaleCountdown className="mt-6 w-full rounded border p-5" />
					<Pricing.PPPToggle className="mt-5" />
					<ProductPricingFeatures productType={product.type} workshops={[]} />
				</Pricing.Details>
			</Pricing.Product>
		</Pricing.Root>
	)
}
