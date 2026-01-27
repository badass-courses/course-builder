import * as React from 'react'
import { headers } from 'next/headers'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getCachedAllWorkshopProducts } from '@/lib/workshops-query'
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

	// Get all products for this workshop (both standalone and cohort)
	const allProducts = await getCachedAllWorkshopProducts(moduleSlug)

	// Prioritize standalone products (not cohort) for the pricing widget
	const standaloneProducts = allProducts.filter((p) => p.type !== 'cohort')
	const cohortProducts = allProducts.filter((p) => p.type === 'cohort')

	// Use standalone product if available, otherwise fall back to first product
	const productForPricing = standaloneProducts[0] || allProducts[0] || null

	// Get full product details for the pricing product
	const product = productForPricing?.id
		? await getProduct(productForPricing.id)
		: null

	let workshopProps

	if (product) {
		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		// Await pricing data to get calculated availability (subtracts purchases)
		const pricingData = await pricingDataLoader
		const calculatedQuantityAvailable = pricingData.quantityAvailable

		const countryCode =
			(await headers()).get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'

		// Pass all products to propsForCommerce so purchases are properly handled
		const commerceProps = await propsForCommerce(
			{
				query: {
					// allowPurchase: 'true',
					...searchParams,
				},
				userId: user?.id,
				products: allProducts,
				countryCode,
			},
			courseBuilderAdapter,
		)

		const baseProps = {
			availableBonuses: [],
			product,
			pricingDataLoader: Promise.resolve(pricingData),
			quantityAvailable: calculatedQuantityAvailable,
			...commerceProps,
		}

		if (!user) {
			workshopProps = baseProps
		} else {
			// Check if user has purchased any of the products
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return allProducts.some((p) => p.id === purchase.productId)
				},
			)

			// Check entitlements via ability using existing utility
			const abilityForResource = await getAbilityForResource(
				undefined,
				moduleSlug,
			)
			const hasPurchasedViaEntitlements = abilityForResource.canViewWorkshop

			// hasPurchasedCurrentProduct should be true if:
			// 1. User has a valid purchase for any of the products, OR
			// 2. User has entitlements that grant access to the workshop
			const hasPurchasedCurrentProduct =
				hasPurchasedViaEntitlements ||
				Boolean(
					purchaseForProduct &&
						(purchaseForProduct.status === 'Valid' ||
							purchaseForProduct.status === 'Restricted'),
				)

			if (!purchaseForProduct && !hasPurchasedViaEntitlements) {
				workshopProps = baseProps
			} else {
				const existingPurchase = purchaseForProduct
					? await courseBuilderAdapter.getPurchaseDetails(
							purchaseForProduct.id,
							user.id,
						)
					: null

				const purchasedProductIds =
					commerceProps?.purchases?.map((purchase) => purchase.productId) || []

				workshopProps = {
					...baseProps,
					hasPurchasedCurrentProduct,
					existingPurchase: existingPurchase?.existingPurchase || null,
					quantityAvailable: calculatedQuantityAvailable,
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

	const ALLOW_PURCHASE =
		searchParams?.allowPurchase === 'true' ||
		(workshopProps?.product?.fields.state === 'published' &&
			workshopProps?.product?.fields.visibility === 'public')

	return <>{children({ ...workshopProps, allowPurchase: ALLOW_PURCHASE })}</>
}
