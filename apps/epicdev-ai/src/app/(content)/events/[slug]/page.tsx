import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { PlayerContainerSkeleton } from '@/components/player-skeleton'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import type { Event } from '@/lib/events'
import { getEvent } from '@/lib/events-query'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { formatInTimeZone } from 'date-fns-tz'
import { count, eq } from 'drizzle-orm'
import ReactMarkdown from 'react-markdown'
import { Event as EventMetaSchema, Ticket } from 'schema-dts'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import {
	Product,
	productSchema,
	Purchase,
	type ContentResourceResource,
} from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'
import { VideoPlayerOverlayProvider } from '@coursebuilder/ui/hooks/use-video-player-overlay'
import { cn } from '@coursebuilder/ui/utils/cn'

import { PostPlayer } from '../../posts/_components/post-player'
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
		openGraph: { images: [getOGImageUrlForResource(event)] },
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

	const hasVideo = event?.resources?.find(
		({ resource }: ContentResourceResource) =>
			resource.type === 'videoResource',
	)

	return (
		<LayoutClient withContainer>
			<main className="relative flex w-full flex-col">
				<EventMetadata
					event={event}
					quantityAvailable={eventProps.quantityAvailable}
				/>
				{event && ability.can('update', 'Content') && (
					<div className="absolute right-5 top-20 flex items-center gap-2">
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
					<div className="flex w-full items-center border-b py-3 text-left font-medium">
						You have purchased a ticket to this event. See you on {eventDate}.{' '}
						<span role="img" aria-label="Waving hand">
							👋
						</span>
					</div>
				) : null}
				<div className="flex w-full flex-col-reverse items-center justify-between py-5 md:flex-row md:items-start">
					<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
						<div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-base sm:justify-start">
							<Link
								href="/posts"
								className="text-primary w-full font-medium hover:underline sm:w-auto"
							>
								Live Event
							</Link>
							<span className="hidden opacity-50 sm:inline-block">・</span>
							{eventDate ? (
								<>
									<p>{eventDate}</p>
									<span className="opacity-50">・</span>
									<p>{eventTime} (PT)</p>
								</>
							) : (
								'Date TBD'
							)}
						</div>
						<h1 className="font-heading fluid-3xl text-balance font-bold">
							{fields.title}
						</h1>
						{fields.description && (
							<h2 className="mt-5 text-balance text-xl font-normal">
								{fields.description}
							</h2>
						)}
						<Contributor className="mt-5" />
					</div>
					{hasVideo && <PlayerContainer event={event} />}
				</div>
				<div className="flex h-full flex-grow flex-col-reverse md:flex-row">
					<article className="prose sm:prose-lg prose-headings:text-balance w-full max-w-none py-8">
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
		</LayoutClient>
	)
}

async function PlayerContainer({ event }: { event: Event | null }) {
	if (!event) {
		notFound()
	}

	const resource = event.resources?.[0]?.resource.id

	const videoResource = await courseBuilderAdapter.getVideoResource(resource)

	return videoResource ? (
		<VideoPlayerOverlayProvider>
			<React.Suspense
				fallback={
					<PlayerContainerSkeleton className="aspect-video h-full max-h-[75vh] w-full bg-black" />
				}
			>
				<section
					aria-label="video"
					className="flex w-full flex-col items-center justify-center rounded-md bg-black shadow-md sm:mb-10"
				>
					<PostPlayer
						title={event.fields?.title}
						thumbnailTime={event.fields?.thumbnailTime || 0}
						postId={event.id}
						className={cn(
							'aspect-video h-full max-h-[75vh] w-full overflow-hidden rounded-md',
						)}
						videoResource={videoResource}
					/>
				</section>
			</React.Suspense>
		</VideoPlayerOverlayProvider>
	) : null
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
