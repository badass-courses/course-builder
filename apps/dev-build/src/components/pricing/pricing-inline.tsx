'use client'

import { Suspense, use } from 'react'

import type { Purchase } from '@coursebuilder/core/schemas'
import type { FormattedPrice } from '@coursebuilder/core/types'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

/**
 * Display inline pricing in MDX content
 * Uses React Suspense to stream pricing data from server
 */
export function PricingInline({
	type,
	pricingDataLoader,
}: {
	type: 'original' | 'discounted'
	pricingDataLoader: Promise<PricingData>
}) {
	return (
		<Suspense
			fallback={
				<span className="bg-muted inline-block h-6 w-16 animate-pulse rounded" />
			}
		>
			<PricingInlineContent type={type} pricingDataLoader={pricingDataLoader} />
		</Suspense>
	)
}

function PricingInlineContent({
	type,
	pricingDataLoader,
}: {
	type: 'original' | 'discounted'
	pricingDataLoader: Promise<PricingData>
}) {
	const pricingData = use(pricingDataLoader)
	const formattedPrice = pricingData?.formattedPrice

	const price =
		type === 'original'
			? formattedPrice?.unitPrice
			: formattedPrice?.calculatedPrice

	if (!price) return null

	return <>${Math.floor(price)}</>
}
