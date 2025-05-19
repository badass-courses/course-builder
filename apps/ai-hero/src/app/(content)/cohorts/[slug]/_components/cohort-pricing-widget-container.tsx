'use client'

import * as React from 'react'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'

import type { CohortPageProps } from './cohort-page-props'

export const CohortPricingWidgetContainer: React.FC<CohortPageProps> = (
	props,
) => {
	const {
		cohort,
		mdx,
		products,
		quantityAvailable,
		purchaseCount,
		totalQuantity,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
		...commerceProps
	} = props
	const { fields } = cohort
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
	const workshops = cohort?.resources?.map(({ resource }) => ({
		title: resource.fields.title,
		slug: resource.fields.slug,
	}))

	return (
		<>
			{product && product.status === 1 && isUpcoming && (
				<PricingWidget
					className="border-b-0"
					workshops={workshops}
					product={product}
					quantityAvailable={quantityAvailable}
					commerceProps={commerceProps}
					pricingDataLoader={pricingDataLoader}
					pricingWidgetOptions={{
						isCohort: true,
						isLiveEvent: false,
						withImage: false,
						withTitle: false,
					}}
				/>
			)}
		</>
	)
}
