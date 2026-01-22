'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'

import { useWorkshopNavigation } from './workshop-navigation-provider'
import type { WorkshopPageProps } from './workshop-page-props'
import { WorkshopPricingWidgetContainer } from './workshop-pricing-widget-container'

export function WorkshopPricingClient({
	product,
	quantityAvailable,
	pricingDataLoader,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
	searchParams,
	className,
	...commerceProps
}: WorkshopPageProps & {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
	className?: string
}) {
	const teamQuantityLimit = 100
	const pathname = usePathname()
	const workshopNavigation = useWorkshopNavigation()
	const workshops =
		(workshopNavigation?.parents?.[0]?.resources &&
			workshopNavigation?.parents?.[0]?.resources.map((resource) => ({
				title: resource.resource.fields?.title,
				slug: resource.resource.fields?.slug,
			}))) ||
		[]

	const resolvedSearchParams = React.use(searchParams)

	return product ? (
		<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
			<WorkshopPricingWidgetContainer
				className={className}
				product={product}
				quantityAvailable={quantityAvailable}
				pricingDataLoader={pricingDataLoader}
				hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
				searchParams={resolvedSearchParams}
				workshops={workshops}
				pathname={pathname}
				pricingWidgetOptions={{
					teamQuantityLimit,
				}}
				{...commerceProps}
			/>
		</PriceCheckProvider>
	) : null
}
