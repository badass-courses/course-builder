import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
	createPricingMdxComponents,
	ResourceActions,
	ResourceAdminActions,
	ResourceBody,
	ResourceHeader,
	ResourceLayout,
	ResourcePricingWidget,
	ResourceShareFooter,
	ResourceSidebar,
	ResourceVisibilityBanner,
} from '@/app/(content)/_components/resource-landing'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import Spinner from '@/components/spinner'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { env } from '@/env.mjs'
import { EventSchema, type Event } from '@/lib/events'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getProductSlugToIdMap } from '@/lib/product-map'
import {
	getActiveCoupon,
	getSaleBannerData,
	getSaleBannerDataFromSearchParams,
} from '@/lib/sale-banner'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { formatInTimeZone } from 'date-fns-tz'
import { Event as EventMetaSchema, Ticket } from 'schema-dts'
import { z } from 'zod'

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
import { AttendeeInstructions } from './_components/event-attendee-insructions'
import { EventDetails, EventDetailsMobile } from './_components/event-details'
import { PurchasedTicketInfo } from './_components/event-purchased-ticket-info'
import { createPurchaseDataLoader } from './_components/purchase-data-provider'

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

	const event = await getEventOrEventSeries(params.slug)

	if (!event) {
		notFound()
	}

	const productParsed = productSchema.safeParse(
		first(event.resourceProducts)?.product,
	)

	let product: Product | null = productParsed.success
		? productParsed.data
		: null

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

	const IS_SERIES = Boolean(
		event.resources?.length && event.resources?.length > 1,
	)

	const events = z
		.array(EventSchema)
		.safeParse(event.resources?.map(({ resource }) => resource)).data

	const purchaseDataPromise = createPurchaseDataLoader(event, searchParams)
	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)
	const purchaseData = await purchaseDataPromise
	const productMap = await getProductSlugToIdMap()
	const defaultCoupon = await getActiveCoupon(searchParams)
	const saleData = await getSaleBannerData(defaultCoupon)

	const mdxComponents = createPricingMdxComponents({
		product,
		hasPurchasedCurrentProduct: purchaseData.hasPurchasedCurrentProduct,
		pricingDataLoader: purchaseData.pricingDataLoader,
		commerceProps: purchaseData,
		allowPurchase: purchaseData.allowPurchase,
		defaultCoupon,
		saleData,
		productMap,
	})

	const { content: eventBody } = await compileMDX(body || '', mdxComponents)

	return (
		<ResourceLayout
			saleBannerData={saleBannerData}
			sidebar={
				<ResourceSidebar>
					<EventDetails events={IS_SERIES ? events || [event] : [event]} />
					<React.Suspense
						fallback={
							<div className="flex items-center justify-center p-6 py-12">
								<Spinner className="size-8" />
							</div>
						}
					>
						<PurchasedTicketInfo
							event={event}
							eventDate={eventDate}
							IS_SERIES={IS_SERIES}
							purchaseDataPromise={purchaseDataPromise}
						/>
						<ResourcePricingWidget
							resourceType="event"
							resourceSlug={event.fields?.slug || ''}
							pricingDataLoader={purchaseDataPromise}
							enrollment={{
								startsAt: sharedFields.startsAt,
								endsAt: sharedFields.endsAt,
								timezone: sharedFields.timezone,
							}}
							mobileCta={<EventDetailsMobile event={event} />}
						/>
					</React.Suspense>
				</ResourceSidebar>
			}
		>
			<EventMetadata event={event} />
			<ResourceVisibilityBanner
				visibility={event.fields?.visibility}
				resourceType={IS_SERIES ? 'event series' : 'event'}
			/>
			<ResourceHeader
				badge={{
					label: IS_SERIES ? 'Event Series' : 'Event',
				}}
				title={title}
				description={description}
				contributor={{ withBio: true, label: 'Hosted by' }}
				adminActions={
					<ResourceAdminActions
						resourceType="event"
						resourceSlugOrId={event.fields?.slug || event.id}
						product={product}
						resourceLabel={IS_SERIES ? 'Event Series' : 'Event'}
					/>
				}
			>
				<ResourceActions title={title} />
			</ResourceHeader>
			<ResourceBody>
				<React.Suspense fallback={null}>
					<AttendeeInstructions
						attendeeInstructions={attendeeInstructions}
						purchaseDataPromise={purchaseDataPromise}
					/>
				</React.Suspense>
				{hasVideo && <PlayerContainer event={event} />}
				{eventBody}
			</ResourceBody>
			<ResourceShareFooter title={title} />
		</ResourceLayout>
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
			<section
				aria-label="video"
				className="mb-5 flex w-full flex-col items-center justify-center rounded-md bg-black shadow-md sm:mb-10"
			>
				<PostPlayer
					postSlug={event.fields?.slug}
					title={event.fields?.title}
					thumbnailTime={event.fields?.thumbnailTime || 0}
					postId={event.id}
					className={cn(
						'aspect-video h-full w-full overflow-hidden rounded-md',
					)}
					videoResource={videoResource}
				/>
			</section>
		</VideoPlayerOverlayProvider>
	) : null
}

const EventMetadata: React.FC<{ event: Event; quantityAvailable?: number }> = ({
	event,
	quantityAvailable = -1,
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
