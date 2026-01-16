import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
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
import { CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Event as EventMetaSchema, Ticket } from 'schema-dts'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, productSchema, Purchase } from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'

import { AttendeeInstructions } from './_components/event-attendee-instructions'
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
		...(event.fields.image
			? {
					openGraph: {
						images: [
							{
								url: event.fields.image,
							},
						],
					},
				}
			: {}),
	}
}

export default async function EventPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await props.searchParams
	const { allowPurchase } = searchParams
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

	const eventImage = event?.fields?.image

	const couponBypassesSoldOut =
		eventProps.couponFromCode?.fields?.bypassSoldOut === true

	const ALLOW_PURCHASE =
		allowPurchase === 'true' ||
		product?.fields.state === 'published' ||
		couponBypassesSoldOut

	return (
		<LayoutClient withContainer>
			<main className="relative">
				<EventMetadata
					event={event}
					quantityAvailable={eventProps.quantityAvailable}
				/>
				{event && ability.can('update', 'Content') && (
					<div className="absolute right-5 top-5 z-10 flex items-center gap-2">
						{product && (
							<Button asChild variant="secondary" size="sm">
								<Link
									href={`/products/${product?.fields?.slug || product?.id}/edit`}
								>
									Edit Product
								</Link>
							</Button>
						)}
						<Button asChild variant="secondary" size="sm">
							<Link href={`/events/${event.fields?.slug || event.id}/edit`}>
								Edit Event
							</Link>
						</Button>
					</div>
				)}

				{eventProps.hasPurchasedCurrentProduct ? (
					<div className="flex w-full flex-col items-center justify-between gap-3 border-b p-3 text-left sm:flex-row">
						<div className="flex items-center">
							<CheckCircle className="mr-2 size-4 text-emerald-600 dark:text-emerald-300" />{' '}
							You have purchased a ticket to this event. See you on {eventDate}.
						</div>
					</div>
				) : null}

				{eventProps.hasPurchasedCurrentProduct && (
					<div className="mx-auto max-w-4xl px-5 pt-8 lg:px-10">
						<AttendeeInstructions
							attendeeInstructions={event.fields.attendeeInstructions}
							hasPurchased={Boolean(eventProps.hasPurchasedCurrentProduct)}
						/>
					</div>
				)}

				<div className="flex flex-col lg:flex-row">
					<div className="w-full">
						<header className="from-card to-background flex w-full flex-col items-center justify-between bg-gradient-to-b md:gap-10 lg:flex-row lg:pt-8">
							{eventImage && (
								<CldImage
									className="flex w-full lg:hidden"
									width={383}
									height={204}
									src={eventImage}
									alt={fields?.title}
								/>
							)}
							<div className="mt-5 flex w-full flex-col items-center px-5 text-center lg:mt-0 lg:items-start lg:pl-10 lg:text-left">
								<div className="text-foreground/80 mb-2 flex flex-wrap items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider sm:justify-start">
									<span className="">Live Workshop</span>
									{/* <span className="hidden opacity-50 sm:inline-block">・</span>
									{eventDate && <p className="hidden sm:block">{eventDate}</p>}
									{eventTime && (
										<>
											<span className="hidden opacity-50 sm:inline-block">
												・
											</span>
											<p className="hidden sm:block">{eventTime} (PT)</p>
										</>
									)} */}
								</div>
								<h1 className="text-balance text-4xl font-bold sm:text-5xl lg:text-6xl">
									{fields.title}
								</h1>
								{fields.description && (
									<h2 className="dark:text-primary mt-5 text-balance text-lg font-normal text-blue-700 sm:text-xl lg:text-2xl">
										<ReactMarkdown
											components={{
												p: ({ children }) => <>{children}</>,
											}}
										>
											{fields.description}
										</ReactMarkdown>
									</h2>
								)}
								<Contributor
									imageSize={60}
									className="mt-8 [&_div]:text-left"
									withBio
								/>
							</div>
						</header>
						<article className="prose dark:prose-invert sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl max-w-none px-5 py-10 sm:px-8 lg:px-10">
							{event.fields.body && (
								<ReactMarkdown>{event.fields.body}</ReactMarkdown>
							)}
						</article>
					</div>
					<EventSidebar event={event}>
						{eventImage && (
							<CldImage
								className="hidden lg:flex"
								width={383}
								height={204}
								src={eventImage}
								alt={fields?.title}
							/>
						)}
						{ALLOW_PURCHASE && (
							<EventPricingWidgetContainer
								{...eventProps}
								hideFeatures
								searchParams={searchParams}
							/>
						)}
						<EventDetails event={event} />
					</EventSidebar>
				</div>
			</main>
		</LayoutClient>
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
