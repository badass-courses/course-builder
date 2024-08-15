'use client'

import * as React from 'react'
import { env } from '@/env.mjs'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { PricingWidget } from '@coursebuilder/commerce-next/pricing/pricing-widget'

import type { EventPageProps } from './event-page-props'
import { EventPricingWidget } from './event-pricing-widget'

export const EventPricingWidgetContainer: React.FC<EventPageProps> = (
	props,
) => {
	const {
		event,
		mdx,
		products,
		quantityAvailable,
		purchaseCount,
		totalQuantity,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
		...commerceProps
	} = props
	const { fields } = event
	const { startsAt } = fields
	const product = products && products[0]
	const purchasedProductIds =
		commerceProps?.purchases?.map((purchase) => purchase.productId) || []
	const hasPurchase = purchasedProductIds.length > 0
	const isUpcoming = startsAt
		? new Date(startsAt) > new Date()
		: startsAt
			? new Date(startsAt) > new Date()
			: true

	const cancelUrl = `${env.NEXT_PUBLIC_URL}/events/${fields?.slug}`

	return (
		<>
			{product && product.status === 1 && isUpcoming && (
				<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
					<EventPricingWidget
						commerceProps={{ ...commerceProps, products: [product] }}
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						product={product}
						quantityAvailable={quantityAvailable}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={{
							withImage: product.type !== 'live',
							withGuaranteeBadge: product.type !== 'live',
							isLiveEvent: product.type === 'live',
							teamQuantityLimit: 2,
							isPPPEnabled: product.type !== 'live',
							cancelUrl: cancelUrl,
						}}
					/>
				</PriceCheckProvider>
			)}
		</>
	)
}
