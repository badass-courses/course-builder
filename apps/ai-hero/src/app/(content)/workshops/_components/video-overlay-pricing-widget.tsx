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
				className=""
				product={product}
				couponId={couponId}
				country={country}
				options={{
					withImage: false,
					withTitle: true,
					withGuaranteeBadge: false,
					isLiveEvent: product.type === 'cohort',
					isCohort: product.type === 'cohort',
					teamQuantityLimit,
					allowTeamPurchase: true,
					isPPPEnabled: true,
					cancelUrl: cancelUrl,
				}}
				userId={commerceProps?.userId}
				pricingDataLoader={pricingDataLoader}
			>
				<Pricing.Product className="w-full">
					<Pricing.ProductImage />
					<Pricing.Details className="px-0 pt-0">
						<div className="mx-auto flex w-full max-w-xs flex-col items-center justify-center">
							<Pricing.Name className="font-medium" />
							<Pricing.LiveQuantity />
							<Pricing.Price className="mb-2 [&_div]:text-white" />
							<Pricing.TeamToggle className='[&_button>span[data-state="checked"]]:bg-primary mb-2' />
							<Pricing.TeamQuantityInput />
							<Pricing.BuyButton className="text-lg font-semibold">
								Enroll Now
							</Pricing.BuyButton>
							<Pricing.GuaranteeBadge />
							<Pricing.LiveRefundPolicy className="max-w-none text-center" />
							<Pricing.SaleCountdown className="py-4" />
						</div>
						<Pricing.PPPToggle className="mx-auto mt-3 w-full max-w-lg" />
					</Pricing.Details>
				</Pricing.Product>
			</Pricing.Root>
		</PriceCheckProvider>
	) : null
}
