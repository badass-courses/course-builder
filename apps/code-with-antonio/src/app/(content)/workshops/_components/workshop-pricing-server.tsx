import * as React from 'react'
import { headers } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import {
	getCachedMinimalWorkshop,
	getCachedWorkshopProduct,
	getWorkshopProduct,
} from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
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

	const workshopProduct = await getCachedWorkshopProduct(moduleSlug)
	const product = await getProduct(workshopProduct?.id)

	let workshopProps

	if (product) {
		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		const countryCode =
			(await headers()).get('x-vercel-ip-country') ||
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

			// Get workshop resource to check ability (cached)
			const workshop = await getCachedMinimalWorkshop(moduleSlug)

			// Use ability system to check if user can view workshop
			// This handles both direct purchases AND subscription entitlements
			const { canViewWorkshop } = workshop
				? await getAbilityForResource(undefined, workshop.id)
				: { canViewWorkshop: false }

			if (!purchaseForProduct && !canViewWorkshop) {
				workshopProps = baseProps
			} else {
				let hasPurchasedCurrentProduct = canViewWorkshop

				if (purchaseForProduct) {
					const { purchase, existingPurchase } =
						await courseBuilderAdapter.getPurchaseDetails(
							purchaseForProduct.id,
							user.id,
						)
					hasPurchasedCurrentProduct =
						hasPurchasedCurrentProduct ||
						Boolean(
							purchase &&
								(purchase.status === 'Valid' ||
									purchase.status === 'Restricted'),
						)
					workshopProps = {
						...baseProps,
						hasPurchasedCurrentProduct,
						existingPurchase,
						quantityAvailable: product.quantityAvailable,
						purchasedProductIds:
							commerceProps?.purchases?.map((purchase) => purchase.productId) ||
							[],
					}
				} else {
					// User has access via subscription/entitlement but no direct purchase
					workshopProps = {
						...baseProps,
						hasPurchasedCurrentProduct: true,
						quantityAvailable: product.quantityAvailable,
						purchasedProductIds:
							commerceProps?.purchases?.map((purchase) => purchase.productId) ||
							[],
					}
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

	const ALLOW_PURCHASE =
		searchParams?.allowPurchase === 'true' ||
		(workshopProps?.product?.fields.state === 'published' &&
			workshopProps?.product?.fields.visibility === 'public')

	return <>{children({ ...workshopProps, allowPurchase: ALLOW_PURCHASE })}</>
}
