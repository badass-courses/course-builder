import * as React from 'react'
import { headers } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { Module } from '@/lib/module'
import { getPricingData } from '@/lib/pricing-query'
import { getWorkshopProduct } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import first from 'lodash/first'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
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
	moduleSlug,
	children,
}: {
	searchParams: { [key: string]: string | string[] | undefined }
	moduleSlug: string
	children: (props: WorkshopPageProps) => React.ReactNode
}) {
	const token = await getServerAuthSession()
	const user = token?.session?.user

	const product = await getWorkshopProduct(moduleSlug)

	let workshopProps

	if (product) {
		const pricingDataLoader = getPricingData({
			productId: product.id,
		})
		const countryCode =
			headers().get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'
		const commerceProps = await propsForCommerce(
			{
				query: {
					// allowPurchase: 'true',
					...searchParams,
				},
				userId: user?.id,
				products: [product],
				countryCode,
			},
			courseBuilderAdapter,
		)

		const baseProps = {
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
