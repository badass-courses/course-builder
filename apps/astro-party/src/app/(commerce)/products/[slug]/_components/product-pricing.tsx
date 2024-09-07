'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { env } from '@/env.mjs'
import { pricingClassNames } from '@/styles/commerce'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { PricingWidget } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { CommerceProps, PricingData } from '@coursebuilder/core/types'

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

	const teamQuantityLimit =
		product.type === 'live'
			? quantityAvailable && quantityAvailable > 5
				? 5
				: quantityAvailable
			: 100

	const pathname = usePathname()
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname

	return (
		<>
			{product && (
				<Wrapper className={pricingClassNames('flex flex-col items-center')}>
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
								teamQuantityLimit,
								isPPPEnabled: product.type !== 'live',
								cancelUrl: `${env.NEXT_PUBLIC_URL}/products/${product.fields?.slug || product.id}`,
							}}
						/>
					</PriceCheckProvider>
				</Wrapper>
			)}
		</>
	)
}
