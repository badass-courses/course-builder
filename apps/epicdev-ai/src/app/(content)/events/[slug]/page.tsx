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
import { EventSchema, type Event } from '@/lib/events'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import {
	CheckCircleIcon,
	DocumentCurrencyDollarIcon,
	DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { formatInTimeZone } from 'date-fns-tz'
import { count, eq } from 'drizzle-orm'
import { CheckCircle, File, StickyNote } from 'lucide-react'
import Markdown from 'react-markdown'
import { Event as EventMetaSchema, Ticket } from 'schema-dts'
import { z } from 'zod'

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
import { EventDetails, EventDetailsMobile } from './_components/event-details'
import { EventPageProps } from './_components/event-page-props'
import { EventPricingWidgetContainer } from './_components/event-pricing-widget-container'
import { EventSidebar } from './_components/event-sidebar'
import {
	EventPricing,
	EventPricingButton,
} from './_components/inline-event-pricing'

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string }>
		searchParams: Promise<{ [key: string]: string | string[] | undefined }>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const event = await getEventOrEventSeries(params.slug)

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

	const event = await getEventOrEventSeries(params.slug)

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

	const { title, description, body } = event.fields

	const sharedFields =
		event.type === 'event'
			? event.fields
			: event?.resources?.[0]?.resource?.fields
	const attendeeInstructions =
		event.fields.attendeeInstructions || sharedFields.attendeeInstructions

	const { startsAt, endsAt } = sharedFields
	const PT = sharedFields.timezone || 'America/Los_Angeles'
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

	const { content: eventBody } = await compileMDX(
		body || '',

		{
			EventPricing: (props) => <EventPricing post={event} {...props} />,
			BuyTicketButton: (props) => (
				<EventPricingButton
					post={event}
					{...props}
					className="hidden lg:flex"
				/>
			),
		},
	)

	const hasPurchasedCurrentProduct = eventProps.hasPurchasedCurrentProduct
	const IS_SERIES = event.resources?.length && event.resources?.length > 1

	const events = z
		.array(EventSchema)
		.safeParse(event.resources?.map(({ resource }) => resource)).data

	return (
		<LayoutClient withContainer>
			<EventMetadata
				event={event}
				quantityAvailable={eventProps.quantityAvailable}
			/>
			<header className="relative mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
				{event && ability.can('update', 'Content') && (
					<div className="top-30 right-0 z-40 flex items-center gap-2 lg:absolute">
						{product && (
							<Button asChild size="sm" variant="outline">
								<Link
									href={`/products/${product?.fields?.slug || product?.id}/edit`}
								>
									Edit Product
								</Link>
							</Button>
						)}
						<Button asChild size="sm" variant="secondary">
							<Link href={`/events/${event.fields?.slug || event.id}/edit`}>
								Edit {IS_SERIES ? 'Event Series' : 'Event'}
							</Link>
						</Button>
					</div>
				)}
				<Link
					href="/events"
					className="bg-primary/20 text-primary mb-2 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-semibold"
				>
					<span>{IS_SERIES ? 'Event Series' : 'Event'}</span>
				</Link>

				{/* {eventDate ? (
								<div className="flex items-center gap-2">
									<Calendar className="size-4" />
									<p>{eventDate}</p>
									<Clock className="ml-3 size-4" />
									<p>{eventTime} (PT)</p>
								</div>
							) : (
								'Date TBD'
							)} */}

				<div className="flex flex-col items-center gap-2 pb-8 lg:items-start">
					<h1 className="font-heading sm:fluid-3xl fluid-2xl text-balance font-bold">
						{title}
					</h1>
					{description && (
						<h2 className="mt-5 text-balance text-lg font-normal text-purple-950 lg:text-xl dark:text-purple-200">
							{description}
						</h2>
					)}
				</div>
			</header>
			<main className="flex w-full grid-cols-12 flex-col pb-16 lg:grid lg:gap-12">
				<div className="col-span-8 flex w-full flex-col">
					{attendeeInstructions && hasPurchasedCurrentProduct && (
						<div className="dark:bg-card dark:border-foreground/10 mb-8 flex flex-col gap-1 rounded-md border bg-white p-6 text-left font-medium shadow-xl">
							<p className="inline-flex items-center font-semibold">
								<DocumentTextIcon className="mr-1 size-5 text-teal-600 dark:text-teal-400" />{' '}
								Attendee Instructions
							</p>
							<Markdown className="prose dark:prose-invert mt-2">
								{attendeeInstructions}
							</Markdown>
						</div>
					)}
					{hasVideo && <PlayerContainer event={event} />}
					<Contributor className="justify-center sm:justify-start" />
					<article className="prose sm:prose-lg prose-headings:text-balance w-full max-w-none py-8">
						{eventBody}
					</article>
				</div>

				<EventSidebar>
					{hasPurchasedCurrentProduct ? (
						<>
							<div
								className={cn(
									'dark:border-b-foreground/10 flex flex-col gap-1 border-b p-6 text-left font-medium',
								)}
							>
								<p className="font-semibold">
									<CheckCircleIcon className="inline-block size-5 text-teal-600 dark:text-teal-400" />{' '}
									You have purchased a ticket{' '}
									{IS_SERIES ? 'to this event series' : 'to this event'}. See
									you on {eventDate}.
								</p>
								{eventProps?.existingPurchase?.merchantChargeId && (
									<p>
										<DocumentCurrencyDollarIcon className="text-primary inline-block size-5" />{' '}
										<Link
											className="text-primary underline underline-offset-2"
											href={`/invoices/${eventProps.existingPurchase?.merchantChargeId}`}
										>
											Invoice
										</Link>
									</p>
								)}
							</div>
							{/* {event.fields.attendeeInstructions && (
								<div className="dark:border-b-foreground/10 flex flex-col gap-1 border-b p-6 text-left font-medium">
									<p className="inline-flex items-center font-semibold">
										<DocumentTextIcon className="mr-1 size-5 text-teal-600 dark:text-teal-400" />{' '}
										Attendee Instructions
									</p>
									<Markdown className="prose dark:prose-invert">
										{event.fields.attendeeInstructions}
									</Markdown>
								</div>
							)} */}
						</>
					) : null}
					<EventDetails events={IS_SERIES ? events || [] : [event]} />
					{!hasPurchasedCurrentProduct && (
						<EventPricingWidgetContainer {...eventProps} />
					)}
				</EventSidebar>
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
					className="mb-5 flex w-full flex-col items-center justify-center rounded-md bg-black shadow-md sm:mb-10"
				>
					<PostPlayer
						title={event.fields?.title}
						thumbnailTime={event.fields?.thumbnailTime || 0}
						postId={event.id}
						className={cn(
							'aspect-video h-full w-full overflow-hidden rounded-md',
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
