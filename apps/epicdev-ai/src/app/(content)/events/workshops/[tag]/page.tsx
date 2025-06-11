import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { Share } from '@/components/share'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { EventSchema } from '@/lib/events'
import { getSoldOutOrPastEventIds } from '@/lib/events-query'
import { getPage } from '@/lib/pages-query'
import type { Tag } from '@/lib/tags'
import { getTag } from '@/lib/tags-query'
import { compileMDX } from '@/utils/compile-mdx'
import { getResourcePath } from '@/utils/resource-paths'
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'
import { and, eq, sql } from 'drizzle-orm'
import { Calendar, ChevronRight, Mail } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

import WorkshopWaitlist from './_components/waitlist'

const MCP_TAG_ID = 'jpiz9'
const PAGE_ID = 'page-c644u'

async function getEventsData(tag: Tag) {
	const allEvents = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'event'),
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, 'published'),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
			},
		},
	})

	// Filter events that have the specific tag
	const events = allEvents.filter((event) =>
		event.tags.some((eventTag) => eventTag.tag.id === tag.id),
	)
	const parsedEvents = EventSchema.array().parse(events)

	const now = new Date()
	const soldOutOrPastIds = await getSoldOutOrPastEventIds()

	// Filter events into past and upcoming
	const pastEvents = parsedEvents.filter((event) => {
		if (!event.fields?.startsAt) return false
		const timezone = event.fields?.timezone ?? 'America/Los_Angeles'
		const eventTimeInUTC = zonedTimeToUtc(
			new Date(event.fields.startsAt),
			timezone,
		)
		return eventTimeInUTC < now
	})

	const upcomingEvents = parsedEvents.filter((event) => {
		if (!event.fields?.startsAt) return false
		if (event.fields.visibility !== 'public') return false

		const timezone = event.fields?.timezone ?? 'America/Los_Angeles'
		const eventTimeInUTC = zonedTimeToUtc(
			new Date(event.fields.startsAt),
			timezone,
		)
		return eventTimeInUTC >= now
	})

	return { pastEvents, upcomingEvents, soldOutOrPastIds }
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ tag: string }>
}): Promise<Metadata> {
	const { tag: tagParam } = await params
	const tag = await getTag(tagParam)
	const page = await getPage(`/events/workshops/${tagParam}`)
	if (!tag) {
		return {}
	}
	const { upcomingEvents, soldOutOrPastIds } = await getEventsData(tag)

	const pageTitle = page?.fields?.title || 'MCP Fundamentals'
	const pageDescription =
		page?.fields?.description ||
		'Learn the fundamentals of MCP and how to use it to build your own AI-powered applications.'
	// Prepare events data for OG image
	const eventsForOG = upcomingEvents.slice(0, 4).map((event) => ({
		id: event.id,
		date: event.fields?.startsAt || '',
		timezone: event.fields?.timezone ?? 'America/Los_Angeles',
		isSoldOut: soldOutOrPastIds.includes(event.id),
	}))

	const ogImageUrl = new URL('/api/og/events', process.env.NEXT_PUBLIC_URL)
	ogImageUrl.searchParams.set('title', pageTitle)
	if (eventsForOG.length > 0) {
		ogImageUrl.searchParams.set(
			'events',
			encodeURIComponent(JSON.stringify(eventsForOG)),
		)
	}

	return {
		title: pageTitle,
		description:
			'Learn the fundamentals of MCP and how to use it to build your own AI-powered applications.',
		openGraph: {
			title: pageTitle,
			description: pageDescription,
			images: [
				{
					url: ogImageUrl.toString(),
					width: 1200,
					height: 630,
					alt: pageTitle,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: pageTitle,
			description: pageDescription,
			images: [ogImageUrl.toString()],
		},
	}
}

export default async function MCPFundamentalsPage({
	params,
}: {
	params: Promise<{ tag: string }>
}) {
	const { tag: tagParam } = await params
	const tag = await getTag(tagParam)
	if (!tag) {
		notFound()
	}
	const page = await getPage(`/events/workshops/${tagParam}`)
	const { pastEvents, upcomingEvents, soldOutOrPastIds } =
		await getEventsData(tag)

	const renderEvent = (
		event: (typeof upcomingEvents)[0],
		isUpcoming = false,
	) => {
		const timezone = event.fields?.timezone ?? 'America/Los_Angeles'
		const isSoldOut = isUpcoming && soldOutOrPastIds.includes(event.id)
		const Comp = isUpcoming ? Link : 'div'
		return (
			<Comp
				href={getResourcePath(event.type, event.fields.slug, 'view')}
				key={event.id}
				className="bg-card/50 hover:bg-card/80 flex flex-col rounded-lg border p-4 shadow-xl backdrop-blur-sm transition ease-in-out"
			>
				<div className="flex items-center justify-between">
					{event.fields?.startsAt && (
						<div className="inline-flex flex-wrap items-center gap-1.5 text-base font-medium">
							<Calendar className="text-primary size-4" />
							{isSoldOut && (
								<div className="bg-primary text-primary-foreground flex-shrink-0 rounded px-1 text-xs">
									Sold Out
								</div>
							)}
							{formatInTimeZone(
								new Date(event.fields.startsAt),
								timezone,
								'EEEE, MMMM d, yyyy',
							)}
						</div>
					)}
					{isUpcoming && (
						<ChevronRight className="text-primary size-4 flex-shrink-0" />
					)}
				</div>
				<div className="flex flex-col text-sm opacity-85">
					<div className="">{event.fields?.title}</div>
				</div>
				{/* <p className="text-muted-foreground">{event.fields?.description}</p> */}
			</Comp>
		)
	}

	const { content: pageBody } = await compileMDX(page?.fields?.body || '')
	const pageTitle = page?.fields?.title || 'MCP Fundamentals'

	const UpcomingEvents = ({ className }: { className?: string }) => {
		return (
			<section className={cn('sticky top-6', className)}>
				{upcomingEvents.length > 0 ? (
					<>
						<p className="mb-4 text-2xl font-semibold">Upcoming Dates</p>
						<div className="space-y-3">
							{upcomingEvents.map((event) => renderEvent(event, true))}
						</div>
					</>
				) : (
					<>
						<div className="mb-4 flex items-center gap-2">
							<div className="bg-primary/10 aspect-square rounded-full p-3">
								<Calendar className="text-primary size-4" />
							</div>
							<p className="text-base font-medium leading-tight">
								Join waitlist to be the first to know when new dates are
								announced:
							</p>
						</div>
						<WorkshopWaitlist title={pageTitle} />
					</>
				)}
			</section>
		)
	}

	return (
		<LayoutClient withContainer>
			<main className="flex w-full grid-cols-12 flex-col pb-16 pt-4 lg:grid lg:gap-12 ">
				<div className="col-span-8 flex w-full flex-col">
					<header className="flex flex-col items-center text-center sm:items-start sm:text-left">
						<h1 className="text-3xl font-bold sm:text-4xl">{pageTitle}</h1>
						{page?.fields?.description && (
							<p className="text-muted-foreground mb-4 mt-4 text-balance text-lg sm:text-xl">
								{page?.fields?.description}
							</p>
						)}
					</header>
					<Contributor className="justify-center sm:justify-start" />
					<article className="prose sm:prose-lg prose-headings:text-balance w-full max-w-none py-8">
						{pageBody}
					</article>
					<section className="mt-5 block border-t pt-8 lg:hidden">
						<UpcomingEvents />
					</section>
					{pastEvents.length > 0 && (
						<section className="mt-5 pt-8 lg:border-t">
							<h2 className="mb-4 text-2xl font-semibold">Past Events</h2>
							<div className="space-y-4">
								{pastEvents.map((event) => renderEvent(event, false))}
							</div>
						</section>
					)}
					<section className="mx-auto flex w-full flex-wrap items-center justify-center gap-5 py-16">
						<strong className="text-lg font-semibold">Share</strong>
						<Share
							className="inline-flex rounded-md border"
							title={pageTitle}
						/>
					</section>
				</div>
				<aside className="relative col-span-4 hidden lg:block">
					<div className="absolute z-0 h-full w-1/2 rotate-6 bg-violet-400/10 blur-3xl dark:hidden" />
					<UpcomingEvents />
				</aside>
			</main>
		</LayoutClient>
	)
}
