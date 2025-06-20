import React from 'react'
import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { Share } from '@/components/share'
import type { EventSchema } from '@/lib/events'
import type { Page } from '@/lib/pages'
import { getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { getResourcePath } from '@/utils/resource-paths'
import { formatInTimeZone } from 'date-fns-tz'
import { Calendar, ChevronRight } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import WorkshopWaitlist from './waitlist'

type Event = z.infer<typeof EventSchema>

interface WorkshopPageProps {
	page: Page | null
	pageTitle: string
	pastEvents: Event[]
	upcomingEvents: Event[]
	soldOutOrPastIds: string[]
}

/**
 * Shared workshop page component for rendering workshop events with tags
 */
export default async function WorkshopPage({
	page,
	pageTitle,
	pastEvents,
	upcomingEvents,
	soldOutOrPastIds,
}: WorkshopPageProps) {
	const renderEvent = (event: Event, isUpcoming = false) => {
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
			</Comp>
		)
	}

	const { content: pageBody } = await compileMDX(page?.fields?.body || '')

	const UpcomingEvents = ({ className }: { className?: string }) => {
		const allUpcomingEventsAreSoldOut = upcomingEvents.every((event) =>
			soldOutOrPastIds.includes(event.id),
		)
		return (
			<section className={cn('sticky top-6', className)}>
				{upcomingEvents.length > 0 && (
					<>
						<p className="mb-4 text-2xl font-semibold">Upcoming Dates</p>
						<div className="space-y-3">
							{upcomingEvents.map((event) => renderEvent(event, true))}
						</div>
					</>
				)}
				{(allUpcomingEventsAreSoldOut || upcomingEvents.length === 0) && (
					<>
						<div className="mb-4 mt-8 flex items-center gap-2">
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
			<main className="relative flex w-full grid-cols-12 flex-col pb-16 pt-4 lg:grid lg:gap-12">
				<React.Suspense fallback={null}>
					<WorkshopActionBar page={page} />
				</React.Suspense>
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

export async function WorkshopActionBar({ page }: { page: Page | null }) {
	const { session, ability } = await getServerAuthSession()

	return (
		<>
			{page && ability.can('update', 'Content') ? (
				<Button asChild size="sm" className="absolute right-0 top-0 z-20">
					<Link href={`/admin/pages/${page.fields.slug}/edit`}>Edit page</Link>
				</Button>
			) : null}
		</>
	)
}
