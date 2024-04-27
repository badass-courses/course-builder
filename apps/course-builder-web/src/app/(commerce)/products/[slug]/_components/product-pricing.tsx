'use client'

import * as React from 'react'
import { PricingData } from '@/lib/pricing-query'
import { CommerceProps } from '@/pricing/commerce-props'
import { PriceCheckProvider } from '@/pricing/pricing-check-context'
import { PricingWidget } from '@/pricing/pricing-widget'

export function ProductPricing({
	product,
	quantityAvailable,
	pricingDataLoader,
	commerceProps,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
}: {
	product: any
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	purchasedProductIds: string[]
	hasPurchasedCurrentProduct?: boolean
}) {
	console.log({ product, quantityAvailable, commerceProps, pricingDataLoader })
	return (
		<>
			{product && (
				<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
					<PricingWidget
						commerceProps={{ ...commerceProps, products: [product] }}
						product={product}
						quantityAvailable={quantityAvailable}
						pricingDataLoader={pricingDataLoader}
					/>
				</PriceCheckProvider>
			)}
		</>
	)
}
