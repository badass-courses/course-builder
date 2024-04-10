import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventTemplate } from '@/app/(content)/events/[slug]/_components/event-template'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, products, purchases } from '@/db/schema'
import { Event, EventSchema } from '@/lib/events'
import { getPricingData, PricingData } from '@/lib/pricing-query'
import { propsForCommerce } from '@/lib/props-for-commerce'
import { getServerAuthSession } from '@/server/auth'
import { and, count, eq, or, sql } from 'drizzle-orm'
import { first } from 'lodash'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'

import {
	Coupon,
	Product,
	productSchema,
	Purchase,
} from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

export type CouponForCode = Coupon & {
	isValid: boolean
	isRedeemable: boolean
}

export type CommerceProps = {
	couponIdFromCoupon?: string
	couponFromCode?: CouponForCode
	userId?: string
	purchases?: Purchase[]
	products?: Product[]
	allowPurchase?: boolean
}

export type EventPageProps = {
	event: Event
	quantityAvailable: number
	totalQuantity: number
	purchaseCount: number
	product?: Product
	mdx?: MDXRemoteSerializeResult
	hasPurchasedCurrentProduct?: boolean
	availableBonuses: any[]
	existingPurchase?: Purchase & { product?: Product | null }
	purchases?: Purchase[]
	userId?: string
	pricingDataLoader: Promise<PricingData>
} & CommerceProps

export default async function EventPage({
	params,
}: {
	params: { slug: string }
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const event = EventSchema.parse(
		await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.type, 'event'),
				or(
					eq(contentResource.id, params.slug),
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						params.slug,
					),
				),
			),
			with: {
				resources: true,
				resourceProducts: {
					with: {
						product: {
							with: {
								price: true,
							},
						},
					},
				},
			},
		}),
	)

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
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild size="sm">
						<Link href={`/events/${event.fields?.slug || event.id}/edit`}>
							Edit
						</Link>
					</Button>
				</div>
			) : (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
			)}
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
