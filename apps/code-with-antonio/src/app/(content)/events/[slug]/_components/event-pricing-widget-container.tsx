'use client'

import * as React from 'react'
import { env } from '@/env.mjs'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { PricingWidget } from '@coursebuilder/commerce-next/pricing/pricing-widget'

import type { EventPageProps } from './event-page-props'

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
			: false

	return (
		<>
			{product && product.status === 1 && isUpcoming && (
				<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
					<PricingWidget
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						commerceProps={{ ...commerceProps, products }}
						product={product}
						quantityAvailable={quantityAvailable}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={{
							withTitle: false,
							withImage: false,
							withGuaranteeBadge: false,
							isLiveEvent: true,
							teamQuantityLimit:
								quantityAvailable >= 0 && quantityAvailable > 5
									? 5
									: quantityAvailable < 0
										? 100
										: quantityAvailable,
							isPPPEnabled: false,
							cancelUrl: `${env.NEXT_PUBLIC_URL}/events/${event.fields?.slug || event.id}`,
						}}
					/>
				</PriceCheckProvider>
			)}
		</>
	)
}
