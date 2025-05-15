'use client'

import * as React from 'react'
import { PricingWidget } from '@/app/(commerce)/products/[slug]/_components/pricing-widget'
import { env } from '@/env.mjs'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'

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
		<div className="py-5">
			{product && product.status === 1 && isUpcoming && (
				<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
					<PricingWidget
						commerceProps={{ ...commerceProps, products: [product] }}
						ctaLabel="Reserve Your Spot"
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
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
							allowTeamPurchase: true,
							cancelUrl: cancelUrl,
						}}
					/>
				</PriceCheckProvider>
			)}
		</div>
	)
}
