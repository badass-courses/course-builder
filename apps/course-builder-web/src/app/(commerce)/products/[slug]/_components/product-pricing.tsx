'use client'

import * as React from 'react'
import { PricingData } from '@/lib/pricing-query'

import { PriceCheckProvider } from '@coursebuilder/commerce-next'
import { CommerceProps } from '@coursebuilder/commerce-next/pricing/commerce-props'
import { PricingWidget } from '@coursebuilder/commerce-next/pricing/pricing-widget'

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
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						product={product}
						quantityAvailable={quantityAvailable}
						pricingDataLoader={pricingDataLoader}
					/>
				</PriceCheckProvider>
			)}
		</>
	)
}
