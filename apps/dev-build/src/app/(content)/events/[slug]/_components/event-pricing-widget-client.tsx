'use client'

import * as React from 'react'
import { PricingWidget } from '@/app/(commerce)/products/[slug]/_components/pricing-widget'
import { env } from '@/env.mjs'
import { useInView } from 'framer-motion'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { cn } from '@coursebuilder/utils-ui/cn'

import { EventDetailsMobile } from './event-details'
import type { EventPageProps } from './event-page-props'
import type { PurchaseData } from './purchase-data-provider'

export const EventPricingWidgetClient: React.FC<{
	purchaseDataPromise: Promise<PurchaseData>
}> = ({ purchaseDataPromise }) => {
	const purchaseData = React.use(purchaseDataPromise)
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
	} = purchaseData

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
	const ref = React.useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { margin: '0px 0px 0% 0px' })

	if (hasPurchasedCurrentProduct) {
		return null
	}

	return (
		<div ref={ref} className="py-5">
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

					<div
						className={cn(
							'bg-background/80 backdrop-blur-xs fixed bottom-5 left-5 right-5 z-50 flex gap-2 rounded-lg border p-4 shadow-xl transition duration-150 ease-in-out lg:hidden',
							{
								'opacity-0': isInView,
							},
						)}
					>
						<EventDetailsMobile event={event} />
					</div>
				</PriceCheckProvider>
			)}
		</div>
	)
}
