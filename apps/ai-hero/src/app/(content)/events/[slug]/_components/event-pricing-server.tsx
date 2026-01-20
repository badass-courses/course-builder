import * as React from 'react'
import { headers } from 'next/headers'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getEvent } from '@/lib/events-query'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import {
	productSchema,
	type Product,
	type Purchase,
} from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'

import { type EventPageProps } from './event-page-props'

/**
 * Server component that fetches event pricing data and provides it via render props.
 * This enables conditional rendering and MDX compilation with pricing-aware components.
 *
 * @param props - Component configuration.
 * @param props.searchParams - URL search parameters for commerce handling.
 * @param props.eventSlug - The event slug to fetch pricing for.
 * @param props.children - Render prop function receiving EventPageProps.
 */
export async function EventPricing({
	searchParams,
	eventSlug,
	children,
}: {
	searchParams: { [key: string]: string | string[] | undefined }
	eventSlug: string
	children: (props: EventPageProps) => React.ReactNode
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const event = await getEvent(eventSlug)

	if (!event) {
		return null
	}

	const productParsed = productSchema.safeParse(
		first(event.resourceProducts)?.product,
	)

	let eventProps: EventPageProps
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

		const baseProps: EventPageProps = {
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
					existingPurchase,
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

	const couponBypassesSoldOut =
		eventProps.couponFromCode?.fields?.bypassSoldOut === true

	const ALLOW_PURCHASE =
		searchParams?.allowPurchase === 'true' ||
		product?.fields.state === 'published' ||
		couponBypassesSoldOut

	return <>{children({ ...eventProps, allowPurchase: ALLOW_PURCHASE })}</>
}
