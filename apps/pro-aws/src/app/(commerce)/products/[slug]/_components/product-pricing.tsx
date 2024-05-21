'use client'

import * as React from 'react'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import {
	PricingData,
	PricingWidget,
} from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { CommerceProps } from '@coursebuilder/commerce-next/utils/commerce-props'

export function ProductPricing({
	product,
	quantityAvailable,
	pricingDataLoader,
	commerceProps,
	purchasedProductIds,
	hasPurchasedCurrentProduct,
}: {
	product: any
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	purchasedProductIds: string[]
	hasPurchasedCurrentProduct?: boolean
}) {
	const dataAttr = product.type === 'live' ? 'data-event' : 'data-default'
	const Wrapper = (props: React.PropsWithChildren<{ className?: string }>) =>
		React.createElement('div', { [dataAttr]: '', ...props })

	return (
		<>
			{product && (
				<Wrapper className="flex flex-col items-center">
					{product.type === 'live' && (
						<h1 className="font-heading mx-auto inline-flex w-full max-w-2xl items-center justify-center text-balance px-5 pb-10 text-center text-5xl font-bold leading-tight">
							{product?.name}
						</h1>
					)}
					<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
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
								teamQuantityLimit:
									quantityAvailable && quantityAvailable > 5
										? 5
										: quantityAvailable,
								isPPPEnabled: product.type !== 'live',
							}}
						/>
					</PriceCheckProvider>
				</Wrapper>
			)}
		</>
	)
}
