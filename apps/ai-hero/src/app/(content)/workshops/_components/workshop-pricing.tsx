'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { env } from '@/env.mjs'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'

import { PricingWidget } from './pricing-widget'
import { useWorkshopNavigation } from './workshop-navigation-provider'
import type { WorkshopPageProps } from './workshop-page-props'

export function WorkshopPricing({
	product,
	quantityAvailable,
	pricingDataLoader,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
	searchParams,
	...commerceProps
}: WorkshopPageProps & {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const teamQuantityLimit = 100
	const pathname = usePathname()
	const cancelUrl = product ? `${env.NEXT_PUBLIC_URL}${pathname}` : ''
	const workshopNavigation = useWorkshopNavigation()
	const workshops = workshopNavigation?.cohorts?.[0]?.resources?.map(
		(resource) => ({
			title: resource.title,
			slug: resource.slug,
		}),
	)
	const { allowPurchase } = React.use(searchParams)

	return product && (product.fields.state === 'published' || allowPurchase) ? (
		<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
			<PricingWidget
				className="px-5"
				workshops={workshops}
				commerceProps={{ ...commerceProps, products: [product] }}
				hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
				product={product}
				quantityAvailable={quantityAvailable}
				pricingDataLoader={pricingDataLoader}
				pricingWidgetOptions={{
					withImage: false,
					withGuaranteeBadge: true,
					isLiveEvent: false,
					isCohort: product.type === 'cohort',
					teamQuantityLimit,
					isPPPEnabled: true,
					cancelUrl: cancelUrl,
				}}
				{...commerceProps}
			/>
		</PriceCheckProvider>
	) : null
}
