import * as React from 'react'
import { usePathname } from 'next/navigation.js'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import type { FormattedPrice } from '@coursebuilder/core/types'

import { useCoupon } from '../coupons/use-coupon'
import { CommerceProps } from '../utils/commerce-props'
import { Pricing } from './pricing'
import { PricingWidgetOptions } from './pricing-props'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

const defaultPricingWidgetOptions: PricingWidgetOptions = {
	withImage: true,
	withGuaranteeBadge: true,
	isLiveEvent: false,
	isPPPEnabled: true,
	teamQuantityLimit: 100,
	allowTeamPurchase: true,
}

export const PricingWidget: React.FC<{
	product: Product
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	hasPurchasedCurrentProduct?: boolean
	pricingWidgetOptions?: PricingWidgetOptions
}> = ({
	hasPurchasedCurrentProduct,
	product,
	quantityAvailable,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions = defaultPricingWidgetOptions,
}) => {
	const pathname = usePathname()
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)
	const ALLOW_PURCHASE = true
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname
	return (
		<div data-pricing-container="" id="buy" key={product.name}>
			<Pricing
				pricingDataLoader={pricingDataLoader}
				cancelUrl={cancelUrl}
				allowPurchase={ALLOW_PURCHASE}
				userId={commerceProps?.userId}
				product={product}
				options={{
					...defaultPricingWidgetOptions,
					...pricingWidgetOptions,
				}}
				purchased={hasPurchasedCurrentProduct}
				couponId={couponId}
				couponFromCode={couponFromCode}
			/>
		</div>
	)
}
