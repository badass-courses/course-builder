import * as React from 'react'
import { courseBuilderAdapter } from '@/db'
import { Module } from '@/lib/module'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import first from 'lodash/first'

import { propsForCommerce } from '@coursebuilder/commerce-next/pricing/props-for-commerce'
import {
	productSchema,
	type Product,
	type Purchase,
	type User,
} from '@coursebuilder/core/schemas'

import { type WorkshopPageProps } from './workshop-page-props'
import { WorkshopPricing as WorkshopPricingClient } from './workshop-pricing'

export async function WorkshopPricing({
	searchParams,
	workshop,
	children,
}: {
	searchParams: { [key: string]: string | string[] | undefined }
	workshop: Module
	children: (props: WorkshopPageProps) => React.ReactNode
}) {
	const token = await getServerAuthSession()
	const user = token?.session?.user
	const productParsed = productSchema.safeParse(
		first(workshop.resourceProducts)?.product,
	)

	let workshopProps: WorkshopPageProps
	let product: Product | null = null

	if (productParsed.success) {
		product = productParsed.data

		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		const commerceProps = await propsForCommerce(
			{
				query: {
					// allowPurchase: 'true',
					...searchParams,
				},
				userId: user?.id,
				products: [productParsed.data],
			},
			courseBuilderAdapter,
		)

		const baseProps = {
			workshop,
			availableBonuses: [],
			product,
			pricingDataLoader,
			quantityAvailable: product.quantityAvailable,
			...commerceProps,
		}

		if (!user) {
			workshopProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				workshopProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				const purchasedProductIds =
					commerceProps?.purchases?.map((purchase) => purchase.productId) || []
				workshopProps = {
					...baseProps,
					hasPurchasedCurrentProduct: Boolean(purchase),
					existingPurchase,
					quantityAvailable: product.quantityAvailable,
					purchasedProductIds,
				}
			}
		}
	} else {
		workshopProps = {
			workshop,
			availableBonuses: [],
			quantityAvailable: -1,
			pricingDataLoader: Promise.resolve({
				formattedPrice: null,
				purchaseToUpgrade: null,
				quantityAvailable: -1,
			}),
		}
	}

	return <>{children(workshopProps)}</>
}
