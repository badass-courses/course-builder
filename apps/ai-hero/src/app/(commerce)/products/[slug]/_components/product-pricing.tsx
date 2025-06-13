'use client'

import * as React from 'react'
import { env } from '@/env.mjs'
import { formatCohortDateRange } from '@/utils/format-cohort-date'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { CommerceProps, PricingData } from '@coursebuilder/core/types'

import { PricingWidget } from './pricing-widget'

export function ProductPricing({
	resource,
	product,
	quantityAvailable,
	pricingDataLoader,
	commerceProps,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
	organizationId,
}: {
	resource: any
	product: any
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	purchasedProductIds: string[]
	hasPurchasedCurrentProduct?: boolean
	organizationId?: string
}) {
	const teamQuantityLimit =
		product.type === 'live'
			? quantityAvailable && quantityAvailable > 5
				? 5
				: quantityAvailable
			: 100

	const cancelUrl = `${env.NEXT_PUBLIC_URL}/products/${product.fields?.slug || product.id}`
	const { fields } = resource
	const { startsAt, endsAt, timezone } = fields
	const { dateString: eventDateString, timeString: eventTimeString } =
		formatCohortDateRange(startsAt, endsAt, timezone)

	return product ? (
		<PriceCheckProvider
			purchasedProductIds={purchasedProductIds}
			organizationId={organizationId}
		>
			<div className="not-prose flex flex-col">
				<p className="flex w-full items-center justify-center pt-5 text-center text-base opacity-80">
					{eventDateString}
				</p>
				<PricingWidget
					commerceProps={{ ...commerceProps, products: [product] }}
					hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
					product={product}
					quantityAvailable={quantityAvailable}
					pricingDataLoader={pricingDataLoader}
					pricingWidgetOptions={{
						withImage: product.type !== 'live',
						withGuaranteeBadge: product.type !== 'live',
						isLiveEvent: product.type === 'live',
						teamQuantityLimit,
						isCohort: product.type === 'cohort',
						isPPPEnabled: !['live', 'cohort'].includes(product.type),
						cancelUrl: cancelUrl,
						allowTeamPurchase: product.type !== 'membership',
					}}
				/>
			</div>
		</PriceCheckProvider>
	) : null
}
