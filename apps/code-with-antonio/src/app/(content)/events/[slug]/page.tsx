import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import type { Event } from '@/lib/events'
import { getEvent } from '@/lib/events-query'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { formatInTimeZone } from 'date-fns-tz'
import { count, eq } from 'drizzle-orm'
import ReactMarkdown from 'react-markdown'
import { Event as EventMetaSchema, Ticket } from 'schema-dts'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, productSchema, Purchase } from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'

import { EventDetails } from './_components/event-details'
import { EventPageProps } from './_components/event-page-props'
import { EventPricingWidgetContainer } from './_components/event-pricing-widget-container'
import { EventSidebar } from './_components/event-sidebar'

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string }>
		searchParams: Promise<{ [key: string]: string | string[] | undefined }>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const event = await getEvent(params.slug)

	if (!event) {
		return parent as Metadata
	}

	return {
		title: event.fields.title,
		description: event.fields.description,
	}
}

export default async function EventPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
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
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM do')}`
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
			<EventMetadata
				event={event}
				quantityAvailable={eventProps.quantityAvailable}
			/>
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
				{product?.fields?.image?.url && (
					<CldImage
						width={400}
						height={400}
						src={product?.fields.image.url}
						alt={fields?.title}
					/>
				)}
			</div>
			<div className="flex flex-col-reverse border-t md:flex-row">
				<article className="prose sm:prose-lg dark:prose-invert prose-headings:text-balance w-full max-w-none px-5 py-8 md:px-8">
					{event.fields.body && (
						<ReactMarkdown>{event.fields.body}</ReactMarkdown>
					)}
				</article>
				<EventSidebar>
					<EventPricingWidgetContainer {...eventProps} />
					<EventDetails event={event} />
				</EventSidebar>
			</div>
		</main>
	)
}

const EventMetadata: React.FC<{ event: Event; quantityAvailable: number }> = ({
	event,
	quantityAvailable,
}) => {
	const eventJsonLd: EventMetaSchema = {
		'@type': 'Event',
		name: event?.fields.title,
		startDate: event?.fields.startsAt as string,
		endDate: event?.fields.endsAt as string,
		description: event?.fields.description,
		inLanguage: 'en-US',
		remainingAttendeeCapacity: quantityAvailable,
		organizer: env.NEXT_PUBLIC_SITE_TITLE,
		actor: {
			'@type': 'Person',
			name: config.author,
			sameAs: [...config.sameAs],
		},
		url: `${env.NEXT_PUBLIC_URL}/events/${event?.fields.slug}`,
	}

	const ticketJsonLd: Ticket = {
		'@type': 'Ticket',
		name: 'Workshop Ticket',
		totalPrice:
			event?.resourceProducts?.[0]?.product?.price?.unitAmount.toString(),
		priceCurrency: 'USD',
		url: `${env.NEXT_PUBLIC_URL}/events/${event?.fields.slug}`,
	}

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(eventJsonLd),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(ticketJsonLd),
				}}
			/>
		</>
	)
}
