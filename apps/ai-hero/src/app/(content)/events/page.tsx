import * as React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { EventSchema } from '@/lib/events'
import { getServerAuthSession } from '@/server/auth'
import { formatInTimeZone } from 'date-fns-tz'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'Live Workshops hosted by Matt Pocock',
}

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center px-5 py-16">
				<h1 className="font-heading text-center text-5xl font-bold">
					Live Workshops
				</h1>
				<h2 className="mt-3 inline-flex items-center gap-2 text-center text-xl font-normal">
					Hosted by{' '}
					<Image
						src={'/matt-pocock.jpg'}
						alt="Matt Pocock"
						width={40}
						height={40}
						className="rounded-full"
					/>{' '}
					Matt Pocock
				</h2>
				<EventsList ability={ability} />
				{ability.can('update', 'Content') ? (
					<div className="max-w-(--breakpoint-md) mx-auto mt-10 flex w-full items-center justify-center py-10">
						<Button asChild variant="secondary">
							<Link href={`/events/new`}>New Event</Link>
						</Button>
					</div>
				) : null}
			</main>
		</LayoutClient>
	)
}

async function EventsList({
	ability,
}: {
	ability: Awaited<ReturnType<typeof getServerAuthSession>>['ability']
}) {
	const eventsModule = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'event'),
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
	})
	const parsedEventsModule = z.array(EventSchema).parse(eventsModule)

	const events = [...parsedEventsModule].filter((event) => {
		if (ability.can('create', 'Content')) {
			return event
		} else {
			return event?.fields?.visibility === 'public'
		}
	})

	const publicEvents = [...eventsModule].filter(
		(event) => event?.fields?.visibility === 'public',
	)

	return (
		<ul className="mx-auto mt-16 flex w-full flex-col gap-5">
			{publicEvents.length === 0 && (
				<p className="w-full text-center">
					There are no public live workshops.
				</p>
			)}
			{events.map((event) => {
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
					<li key={event.id}>
						<Card className="bg-background flex flex-col items-center gap-3 rounded-none border-none p-0 md:flex-row">
							{event?.fields?.image && (
								<Link
									className="shrink-0"
									href={`/events/${event.fields.slug || event.id}`}
								>
									<CldImage
										className="shrink-0"
										width={200}
										height={200}
										src={event.fields.image}
										alt={event.fields.title}
									/>
								</Link>
							)}
							<div className="w-full">
								<CardHeader className="mb-2 p-0">
									<CardTitle className="text-lg font-normal text-gray-100 sm:text-2xl">
										<Link
											href={`/events/${event?.fields?.slug || event.id}`}
											className="w-full text-balance hover:underline"
										>
											{event?.fields?.title}
										</Link>
									</CardTitle>
									<div className="flex items-center gap-1 text-sm">
										<p>{eventDate}</p>
										<span className="opacity-50">・</span>
										<p>{eventTime} (PT)</p>
									</div>
								</CardHeader>
								{event?.fields?.description && (
									<CardContent className="px-0 py-3">
										<p className="text-muted-foreground text-base">
											{event?.fields?.description}
										</p>
									</CardContent>
								)}
								<CardFooter className="flex items-center justify-between gap-3 px-0 py-3">
									<Contributor className="text-sm font-light" />
									<div className="flex items-center gap-2">
										{ability.can('create', 'Content') && (
											<>
												<span className="text-sm">
													{event?.fields?.visibility}
												</span>
												<Button asChild variant="outline" size="sm">
													<Link
														href={`/events/${event?.fields?.slug || event.id}/edit`}
													>
														Edit
													</Link>
												</Button>
											</>
										)}
									</div>
								</CardFooter>
							</div>
						</Card>
					</li>
				)
			})}
		</ul>
	)
}
