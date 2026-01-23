import { headers } from 'next/headers'
import { courseBuilderAdapter, db } from '@/db'
import { purchases } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { eq } from 'drizzle-orm'

import { formatPricesForProduct } from '@coursebuilder/core'
import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { productSchema, Purchase } from '@coursebuilder/core/schemas'
import {
	PricingData,
	type FormatPricesForProductOptions,
} from '@coursebuilder/core/types'

import { getProducts } from './products-query'

export async function getPricingData(
	options: Partial<FormatPricesForProductOptions>,
): Promise<PricingData> {
	const startTime = performance.now()
	await log.debug('query.pricing.start', {
		productId: options.productId,
		event: 'query.pricing.start',
	})

	if (!options.productId) {
		await log.debug('query.pricing.no_product', {
			durationMs: performance.now() - startTime,
		})
		return {
			formattedPrice: null,
			purchaseToUpgrade: null,
			quantityAvailable: -1,
		}
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

	let resolvedQuantityAvailable: number
	const dbProductQuantityAvailable = product?.quantityAvailable

	if (dbProductQuantityAvailable === -1) {
		resolvedQuantityAvailable = -1 // Product is unlimited
	} else {
		// Product has a finite quantity, subtract purchases
		resolvedQuantityAvailable =
			(dbProductQuantityAvailable || 0) - totalPurchases.length
	}

	await log.debug('query.pricing.complete', {
		productId: options.productId,
		quantityAvailable: resolvedQuantityAvailable,
		hasPurchaseToUpgrade: !!purchaseToUpgrade,
		totalPurchases: totalPurchases.length,
		durationMs: performance.now() - startTime,
		event: 'query.pricing.complete',
	})

	return {
		formattedPrice,
		purchaseToUpgrade,
		quantityAvailable: resolvedQuantityAvailable,
	}
}

export async function getPricingProps({
	searchParams,
}: {
	searchParams?: { [key: string]: string | undefined }
}) {
	const startTime = performance.now()
	await log.debug('query.pricing.props.start', {
		event: 'query.pricing.props.start',
	})

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
		const countryCode =
			(await headers()).get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'
		const commerceProps = await propsForCommerce(
			{
				query: {
					...searchParams,
				},
				products: products as any,
				userId: user?.id,
				countryCode,
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
		await log.debug('query.pricing.props.no_product', {
			durationMs: performance.now() - startTime,
		})
		return {
			pricingDataLoader: null,
			allowPurchase: false,
			commerceProps: null,
			product: null,
			hasPurchased: false,
		}
	}

	await log.debug('query.pricing.props.complete', {
		hasProduct: !!product,
		hasUser: !!user,
		hasPurchased: pricingProps.hasPurchased || false,
		durationMs: performance.now() - startTime,
		event: 'query.pricing.props.complete',
	})

	return pricingProps
}
