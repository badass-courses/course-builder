'use client'

import * as React from 'react'
import { env } from '@/env.mjs'
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
						pricingWidgetOptions={{
							withImage: true,
							withGuaranteeBadge: true,
							isLiveEvent: product.type === 'live',
							teamQuantityLimit:
								quantityAvailable && quantityAvailable > 5
									? 5
									: quantityAvailable,
							isPPPEnabled: product.type !== 'live',
							cancelUrl: `${env.NEXT_PUBLIC_URL}/products/${product.fields?.slug || product.id}`,
						}}
					/>
				</PriceCheckProvider>
			)}
		</>
	)
}
