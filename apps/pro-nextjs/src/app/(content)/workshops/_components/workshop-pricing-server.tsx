import * as React from 'react'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getWorkshopProduct } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

import { propsForCommerce } from '@coursebuilder/commerce-next/pricing/props-for-commerce'
import { productSchema, type Purchase } from '@coursebuilder/core/schemas'

import { type WorkshopPageProps } from './workshop-page-props'

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

	const workshopProduct = await getWorkshopProduct(moduleSlug)
	const product = await getProduct(workshopProduct?.id)

	let workshopProps

	if (product) {
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
				products: [product],
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
