import * as React from 'react'
import { headers } from 'next/headers'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { type Event } from '@/lib/events'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import {
	Product,
	productSchema,
	Purchase,
	type ContentResourceResource,
} from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'

import type { EventPageProps } from './event-page-props'

export interface PurchaseData extends EventPageProps {
	// All the props needed for EventPricingWidgetClient and purchase-dependent UI
}

// Server function to create the purchase data loader with all commerce logic
export async function createPurchaseDataLoader(
	event: Event,
	searchParams: { [key: string]: string | string[] | undefined },
): Promise<PurchaseData> {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	const productParsed = productSchema.safeParse(
		first(event.resourceProducts)?.product,
	)

	let eventProps: PurchaseData
	let product: Product | null = null

	if (productParsed.success) {
		product = productParsed.data

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
					allowPurchase: 'true',
					...searchParams,
				},
				userId: user?.id,
				products: [productParsed.data],
				countryCode,
			},
			courseBuilderAdapter,
		)

		const { count: purchaseCount } = await db
			.select({ count: count() })
			.from(purchases)
			.where(eq(purchases.productId, product.id))
			.then((res) => res[0] ?? { count: 0 })

		const productWithQuantityAvailable = await db
			.select({ quantityAvailable: products.quantityAvailable })
			.from(products)
			.where(eq(products.id, product.id))
			.then((res) => res[0])

		let quantityAvailable = -1

		if (productWithQuantityAvailable) {
			quantityAvailable =
				productWithQuantityAvailable.quantityAvailable - purchaseCount
		}

		if (quantityAvailable < 0) {
			quantityAvailable = -1
		}

		const baseProps = {
			event,
			availableBonuses: [],
			purchaseCount,
			quantityAvailable,
			totalQuantity: productWithQuantityAvailable?.quantityAvailable || 0,
			product,
			pricingDataLoader,
			...commerceProps,
		}

		if (!user) {
			eventProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				eventProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				eventProps = {
					...baseProps,
					hasPurchasedCurrentProduct: Boolean(purchase),
					existingPurchase: purchaseForProduct,
				}
			}
		}
	} else {
		eventProps = {
			event,
			availableBonuses: [],
			quantityAvailable: -1,
			totalQuantity: -1,
			purchaseCount: 0,
			pricingDataLoader: Promise.resolve({
				formattedPrice: null,
				purchaseToUpgrade: null,
				quantityAvailable: -1,
			}),
		}
	}

	return eventProps
}
