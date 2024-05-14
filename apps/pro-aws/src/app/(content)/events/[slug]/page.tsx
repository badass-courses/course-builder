import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getEvent } from '@/lib/events-query'
import { getPricingData } from '@/lib/pricing-query'
import { propsForCommerce } from '@/lib/props-for-commerce'
import { getServerAuthSession } from '@/server/auth'
import { formatInTimeZone } from 'date-fns-tz'
import { count, eq } from 'drizzle-orm'
import { first } from 'lodash'
import ReactMarkdown from 'react-markdown'

import { Product, productSchema, Purchase } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

import { EventDetails } from './_components/event-details'
import { EventPageProps } from './_components/event-page-props'
import { EventPricingWidgetContainer } from './_components/event-pricing-widget-container'

export async function generateMetadata(
	{
		params,
		searchParams,
	}: {
		params: { slug: string }
		searchParams: { [key: string]: string | string[] | undefined }
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const event = await getEvent(params.slug)

	if (!event) {
		return parent as Metadata
	}

	return {
		title: event.fields.title,
		description: event.fields.description,
	}
}

export default async function EventPage({
	params,
}: {
	params: { slug: string }
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

	const { fields } = event
	const { startsAt, endsAt } = fields
	const PT = fields.timezone || 'America/Los_Angeles'
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM d')}`
	const eventTime =
		startsAt &&
		endsAt &&
		`${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(
			new Date(endsAt),
			PT,
			'h:mm a',
		)}`
	return (
		<main className="container relative border-x px-0">
			{event && ability.can('update', 'Content') && (
				<div className="absolute right-5 top-5 flex items-center gap-2">
					{product && (
						<Button asChild variant="secondary">
							<Link
								href={`/products/${product?.fields?.slug || product?.id}/edit`}
							>
								Edit Product
							</Link>
						</Button>
					)}
					<Button asChild variant="secondary">
						<Link href={`/events/${event.fields?.slug || event.id}/edit`}>
							Edit Event
						</Link>
					</Button>
				</div>
			)}
			{eventProps.hasPurchasedCurrentProduct ? (
				<div className="flex w-full items-center border-b px-5 py-5 text-left">
					You have purchased a ticket to this event. See you on {eventDate}.{' '}
					<span role="img" aria-label="Waving hand">
						👋
					</span>
				</div>
			) : null}
			<div className="flex w-full flex-col-reverse items-center justify-between px-5 py-8 md:flex-row md:px-8 lg:px-16">
				<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
					<div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-base sm:justify-start">
						<Link
							href="/events"
							className="text-primary w-full hover:underline sm:w-auto"
						>
							Live Workshop
						</Link>
						<span className="hidden opacity-50 sm:inline-block">・</span>
						<p>{eventDate}</p>
						<span className="opacity-50">・</span>
						<p>{eventTime} (PT)</p>
					</div>
					<h1 className="font-heading text-balance text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
						{fields.title}
					</h1>
					{fields.description && (
						<h2 className="mt-5 text-balance text-xl">{fields.description}</h2>
					)}
					<Contributor className="mt-5" />
				</div>
				{fields?.image && (
					<CldImage
						width={400}
						height={400}
						src={fields.image}
						alt={fields?.title}
					/>
				)}
			</div>
			<div className="flex flex-col-reverse border-t md:flex-row">
				<article className="prose sm:prose-lg prose-invert prose-headings:text-balance w-full max-w-none px-5 py-8 md:px-8">
					{event.fields.body && (
						<ReactMarkdown>{event.fields.body}</ReactMarkdown>
					)}
				</article>
				<div
					data-event={fields.slug}
					className="flex w-full flex-col gap-3 border-l md:max-w-sm"
				>
					<EventPricingWidgetContainer {...eventProps} />
					<EventDetails event={event} />
				</div>
			</div>
		</main>
	)
}
