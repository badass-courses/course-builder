import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import Spinner from '@/components/spinner'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { EventSchema, type Event } from '@/lib/events'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { formatInTimeZone } from 'date-fns-tz'
import { eq } from 'drizzle-orm'
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
import { EventDetails } from './_components/event-details'
import { EventPricingWidgetClient } from './_components/event-pricing-widget-client'
import { PurchasedTicketInfo } from './_components/event-purchased-ticket-info'
import { EventSidebar } from './_components/event-sidebar'
import {
	EventPricing,
	EventPricingButton,
} from './_components/inline-event-pricing'
import { createPurchaseDataLoader } from './_components/purchase-data-provider'

export const experimental_ppr = true

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

	// Handle office hours events separately
	const isOfficeHours = event?.fields?.eventType === 'office-hours'
	const { ability, session } = await getServerAuthSession()
	let cohort = null
	let hasAccess = false

	if (isOfficeHours && event?.fields?.cohortId) {
		// Get the cohort this office hours belongs to
		cohort = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, event.fields.cohortId),
			with: {
				resourceProducts: {
					with: {
						product: true,
					},
				},
			},
		})

		// Check if user has purchased the cohort
		if (session?.user?.id && cohort) {
			const cohortProduct = cohort.resourceProducts?.[0]?.product
			if (cohortProduct) {
				const purchase = await courseBuilderAdapter.getPurchaseForProduct({
					userId: session.user.id,
					productId: cohortProduct.id,
				})
				hasAccess = !!purchase
			}
		}

		// Admins always have access
		if (ability.can('update', 'Content')) {
			hasAccess = true
		}
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

	const { content: eventBody } = await compileMDX(body || '', {
		EventPricing: (props) =>
			!isOfficeHours ? <EventPricing post={event} {...props} /> : null,
		BuyTicketButton: (props) =>
			!isOfficeHours ? (
				<EventPricingButton
					post={event}
					{...props}
					className="hidden lg:flex"
				/>
			) : null,
	})

	const IS_SERIES = Boolean(
		event.resources?.length && event.resources?.length > 1,
	)

	const events = z
		.array(EventSchema)
		.safeParse(event.resources?.map(({ resource }) => resource)).data

	const purchaseDataPromise = createPurchaseDataLoader(event, searchParams)

	return (
		<LayoutClient withContainer>
			<EventMetadata event={event} />
			<header className="relative mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
				<React.Suspense fallback={null}>
					<AdminActions
						event={event}
						product={product}
						IS_SERIES={Boolean(IS_SERIES)}
					/>
				</React.Suspense>
				<Link
					href={
						isOfficeHours && cohort
							? `/cohorts/${cohort.fields?.slug}`
							: '/events'
					}
					className="bg-primary/20 text-primary mb-2 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-semibold"
				>
					<span>
						{isOfficeHours
							? 'Cohort Office Hours'
							: IS_SERIES
								? 'Event Series'
								: 'Event'}
					</span>
				</Link>
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
				{isOfficeHours && !hasAccess ? (
					<div className="col-span-12">
						<div className="mx-auto max-w-2xl text-center">
							<div className="bg-card rounded-lg border p-8 shadow-sm">
								<h2 className="mb-4 text-2xl font-bold">Cohort Members Only</h2>
								<p className="text-muted-foreground mb-6">
									This office hours session is part of the{' '}
									{cohort?.fields?.title || 'cohort'} program. To access this
									content, you need to purchase the cohort.
								</p>
								{cohort && (
									<Button asChild size="lg">
										<Link href={`/cohorts/${cohort.fields?.slug}`}>
											View Cohort Details
										</Link>
									</Button>
								)}
							</div>
						</div>
					</div>
				) : (
					<>
						<div className="col-span-8 flex w-full flex-col">
							{/* Attendee instructions with purchase data promise */}
							<React.Suspense fallback={null}>
								<AttendeeInstructions
									attendeeInstructions={attendeeInstructions}
									purchaseDataPromise={purchaseDataPromise}
								/>
							</React.Suspense>
							{hasVideo && <PlayerContainer event={event} />}
							<Contributor className="justify-center sm:justify-start" />
							<article className="prose sm:prose-lg prose-headings:text-balance w-full max-w-none py-8">
								{eventBody}
							</article>
						</div>
						<EventSidebar>
							<EventDetails events={IS_SERIES ? events || [event] : [event]} />
							{!isOfficeHours && (
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
									<EventPricingWidgetClient
										purchaseDataPromise={purchaseDataPromise}
									/>
								</React.Suspense>
							)}
						</EventSidebar>
					</>
				)}
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

async function AdminActions({
	event,
	product,
	IS_SERIES,
}: {
	event: Event
	product: Product | null
	IS_SERIES: boolean
}) {
	const { session, ability } = await getServerAuthSession()
	return (
		<>
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
		</>
	)
}
