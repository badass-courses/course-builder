import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FloatingActionsBar from '@/components/floating-actions-bar'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getEvent } from '@/lib/events-query'
import { getPricingData } from '@/lib/pricing-query'
import { propsForCommerce } from '@/lib/props-for-commerce'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'
import { first } from 'lodash'

import { Product, productSchema, Purchase } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

import { EventPageProps } from './_components/event-page-props'
import { EventTemplate } from './_components/event-template'

export default async function EventPage({
	params,
	searchParams,
}: {
	params: { slug: string }
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const event = await getEvent(params.slug)

	if (!event) {
		notFound()
	}

	const productParsed = productSchema.safeParse(
		first(event.resourceProducts)?.product,
	)

	let eventProps: EventPageProps
	let product: Product | null = null

	if (productParsed.success) {
		product = productParsed.data
		const pricingDataLoader = getPricingData(product?.id)

		const commerceProps = await propsForCommerce({
			query: {
				allowPurchase: 'true',
				...searchParams,
			},
			userId: user?.id,
			products: [productParsed.data],
		})

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

	return (
		<div>
			{event && ability.can('update', 'Content') ? (
				<FloatingActionsBar>
					<Button asChild size="sm">
						<Link href={`/events/${event.fields?.slug || event.id}/edit`}>
							Edit
						</Link>
					</Button>
				</FloatingActionsBar>
			) : null}
			{eventProps.hasPurchasedCurrentProduct ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					you have a ticket to {event.fields?.title} see you on{' '}
					{event.fields?.startsAt}
				</div>
			) : (
				<EventTemplate {...eventProps} />
			)}
		</div>
	)
}
