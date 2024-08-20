import { courseBuilderAdapter, db } from '@/db'
import { purchases } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import { PricingData } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { propsForCommerce } from '@coursebuilder/commerce-next/pricing/props-for-commerce'
import { formatPricesForProduct } from '@coursebuilder/core'
import { productSchema, Purchase } from '@coursebuilder/core/schemas'
import {
	type FormatPricesForProductOptions,
	type FormattedPrice,
} from '@coursebuilder/core/types'

import { getProducts } from './products-query'

export async function getPricingData(
	options: Partial<FormatPricesForProductOptions>,
): Promise<PricingData> {
	if (!options.productId)
		return {
			formattedPrice: null,
			purchaseToUpgrade: null,
			quantityAvailable: -1,
		}

	const formattedPrice = await formatPricesForProduct({
		...options,
		ctx: courseBuilderAdapter,
	})

	const product = await courseBuilderAdapter.getProduct(options.productId)
	const totalPurchases = await db.query.purchases.findMany({
		where: eq(purchases.productId, options.productId),
	})

	const purchaseToUpgrade = formattedPrice.upgradeFromPurchaseId
		? await courseBuilderAdapter.getPurchase(
				formattedPrice.upgradeFromPurchaseId,
			)
		: null
	return {
		formattedPrice,
		purchaseToUpgrade,
		quantityAvailable:
			(product?.quantityAvailable || 0) - totalPurchases.length,
	}
}

export async function getPricingProps({
	searchParams,
}: {
	searchParams?: { [key: string]: string | undefined }
}) {
	const token = await getServerAuthSession()
	const user = token?.session?.user
	const products = await getProducts()
	const product = products[0]
	const allowPurchase =
		searchParams?.allowPurchase === 'true' ||
		product?.fields.visibility === 'public'
	let pricingProps
	if (product) {
		const pricingDataLoader = getPricingData({
			productId: product?.id,
		})
		const commerceProps = await propsForCommerce(
			{
				query: {
					...searchParams,
				},
				products: products as any,
				userId: user?.id,
			},
			courseBuilderAdapter,
		)

		const baseProps = {
			pricingDataLoader,
			allowPurchase,
			commerceProps,
			product,
			hasPurchased: false,
		}

		if (!user) {
			pricingProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)
			if (!purchaseForProduct) {
				pricingProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				const purchasedProductIds =
					commerceProps?.purchases?.map((purchase) => purchase.productId) || []
				pricingProps = {
					...baseProps,
					hasPurchased: Boolean(
						purchase &&
							(purchase.status === 'Valid' || purchase.status === 'Restricted'),
					),
					existingPurchase,
					purchasedProductIds,
				}
			}
		}
	} else {
		return {
			pricingDataLoader: null,
			allowPurchase: false,
			commerceProps: null,
			product: null,
			hasPurchased: false,
		}
	}
	return pricingProps
}
