'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { env } from '@/env.mjs'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { PricingData } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { CommerceProps } from '@coursebuilder/commerce-next/utils/commerce-props'
import type { Product } from '@coursebuilder/core/schemas'

import { PricingWidget } from './pricing-widget'
import type { WorkshopPageProps } from './workshop-page-props'

export function WorkshopPricing({
	product,
	quantityAvailable,
	pricingDataLoader,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
	...commerceProps
}: WorkshopPageProps) {
	const teamQuantityLimit = 100
	const pathname = usePathname()
	const cancelUrl = product ? `${env.NEXT_PUBLIC_URL}${pathname}` : ''

	return product ? (
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
					isLiveEvent: false,
					teamQuantityLimit,
					isPPPEnabled: true,
					cancelUrl: cancelUrl,
				}}
				{...commerceProps}
			/>
		</PriceCheckProvider>
	) : null
}
