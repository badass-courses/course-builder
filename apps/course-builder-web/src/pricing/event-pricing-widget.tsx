import * as React from 'react'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { PricingData } from '@/lib/pricing-query'
import { CommerceProps } from '@/pricing/commerce-props'
import { Pricing } from '@/pricing/pricing'

export const EventPricingWidget: React.FC<{
	product: any
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
}> = ({ product, quantityAvailable, commerceProps, pricingDataLoader }) => {
	const pathname = usePathname()
	const params = useParams()
	const searchParams = useSearchParams()
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = { validCoupon: false } //useCoupon(commerceProps?.couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)
	const purchases = commerceProps?.purchases || []
	const purchasedProductIds = purchases.map((purchase) => purchase.productId)
	const ALLOW_PURCHASE = true
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname
	const hasPurchased = purchasedProductIds.includes(product.productId)
	return (
		<div data-pricing-container="" id="buy" key={product.name}>
			<Pricing
				pricingDataLoader={pricingDataLoader}
				cancelUrl={cancelUrl}
				allowPurchase={ALLOW_PURCHASE}
				userId={commerceProps?.userId}
				product={product}
				options={{
					withImage: false,
					withGuaranteeBadge: false,
					isLiveEvent: true,
					teamQuantityLimit:
						quantityAvailable && quantityAvailable > 5 ? 5 : quantityAvailable,
					isPPPEnabled: false,
				}}
				purchased={hasPurchased}
				couponId={couponId}
				couponFromCode={couponFromCode}
			/>
		</div>
	)
}
