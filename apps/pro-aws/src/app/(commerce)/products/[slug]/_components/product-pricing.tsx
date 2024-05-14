'use client'

import * as React from 'react'
import { PricingData } from '@/lib/pricing-query'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { PricingWidget } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { CommerceProps } from '@coursebuilder/commerce-next/utils/commerce-props'

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
						pricingWidgetOptions={{
							withImage: true,
							withGuaranteeBadge: true,
							isLiveEvent: product.type === 'live',
							teamQuantityLimit:
								quantityAvailable && quantityAvailable > 5
									? 5
									: quantityAvailable,
							isPPPEnabled: product.type !== 'live',
						}}
					/>
				</PriceCheckProvider>
			)}
		</>
	)
}
