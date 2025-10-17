'use client'

import React, { use } from 'react'

import { PricingData } from '@coursebuilder/core/types'

export function CohortPricingProvider({
	children,
	pricingDataLoader,
}: {
	children: React.ReactNode
	pricingDataLoader: Promise<PricingData>
}) {
	return (
		<PricingContext.Provider value={{ pricingDataLoader }}>
			{children}
		</PricingContext.Provider>
	)
}

const PricingContext = React.createContext<
	| {
			pricingDataLoader: Promise<PricingData>
	  }
	| undefined
>(undefined)

export function useCohortPricing() {
	const context = use(PricingContext)
	if (!context) {
		throw new Error(
			'useCohortPricing must be used within a CohortPricingProvider',
		)
	}
	return context
}
