'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { env } from '@/env.mjs'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'

import type { WorkshopPageProps } from './workshop-page-props'

export function VideoOverlayWorkshopPricing({
	product,
	quantityAvailable,
	pricingDataLoader,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
	country,
	...commerceProps
}: WorkshopPageProps) {
	const teamQuantityLimit = 100

	const pathname = usePathname()

	const cancelUrl = product ? `${env.NEXT_PUBLIC_URL}${pathname}` : ''
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return product ? (
		<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
			<Pricing.Root
				className="mx-auto w-full max-w-md"
				product={product}
				couponId={couponId}
				country={country}
				options={{
					withImage: true,
					withGuaranteeBadge: true,
					isLiveEvent: false,
					teamQuantityLimit,
					isPPPEnabled: true,
					cancelUrl: cancelUrl,
				}}
				userId={commerceProps?.userId}
				pricingDataLoader={pricingDataLoader}
			>
				<Pricing.Product className="w-full">
					<Pricing.ProductImage />
					<Pricing.Details className="px-0">
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
		</PriceCheckProvider>
	) : null
}
