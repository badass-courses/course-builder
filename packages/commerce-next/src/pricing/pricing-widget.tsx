import * as React from 'react'
import { useParams, usePathname, useSearchParams } from 'next/navigation.js'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import type { FormattedPrice } from '@coursebuilder/core/types'

import { CommerceProps } from './commerce-props.js'
import { Pricing } from './pricing.js'
import { useCoupon } from './use-coupon.js'

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
}> = ({
	hasPurchasedCurrentProduct,
	product,
	quantityAvailable,
	commerceProps,
	pricingDataLoader,
}) => {
	console.log({
		product,
		quantityAvailable,
		commerceProps,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
	})

	const pathname = usePathname()
	const params = useParams()
	const searchParams = useSearchParams()
	const couponFromCode = commerceProps?.couponFromCode
	const { redeemableCoupon, RedeemDialogForCoupon, validCoupon } =
		useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)
	const ALLOW_PURCHASE = true
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname
	console.log('💰', { commerceProps, product })
	return (
		<div data-pricing-container="" id="buy" key={product.name}>
			<Pricing
				pricingDataLoader={pricingDataLoader}
				cancelUrl={cancelUrl}
				allowPurchase={ALLOW_PURCHASE}
				userId={commerceProps?.userId}
				product={product}
				options={{
					withImage: true,
					withGuaranteeBadge: true,
					isLiveEvent: product.type === 'live',
					teamQuantityLimit:
						quantityAvailable >= 0 && quantityAvailable > 5
							? 5
							: quantityAvailable < 0
								? 100
								: quantityAvailable,
					isPPPEnabled: product.type !== 'live',
				}}
				purchased={hasPurchasedCurrentProduct}
				couponId={couponId}
				couponFromCode={couponFromCode}
			/>
		</div>
	)
}
