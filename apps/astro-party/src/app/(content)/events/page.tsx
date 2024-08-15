import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import { Layout } from '@/components/layout'
import config from '@/config'
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
	title: `Live Events & Workshops hosted by ${config.author}`,
}

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()

	return (
		<>
			<Layout>
				<div className=" mx-auto w-full max-w-screen-md pb-10 pt-16">
					<h1 className="font-heading fluid-3xl text-center font-bold">
						Astro Live Events & Workshops
					</h1>
				</div>
				<EventsList />
				{ability.can('update', 'Content') ? (
					<div className="mx-auto mt-10 flex w-full max-w-screen-md items-center justify-center py-10">
						<Button asChild variant="secondary">
							<Link href={`/events/new`}>New Event</Link>
						</Button>
					</div>
				) : null}
				<div
					className="absolute top-0 -z-10 h-full w-full max-w-screen-md"
					aria-hidden="true"
				/>
			</Layout>
		</>
	)
}

async function EventsList() {
	const { ability } = await getServerAuthSession()
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
		<ul className="mx-auto mt-10 flex w-full max-w-screen-md flex-col gap-5">
			{publicEvents.length === 0 && (
				<p className="mb-10 text-center">There are no public events.</p>
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
						<Card className="bg-background flex flex-col items-center gap-3 rounded-none border-none p-0 shadow-none md:flex-row">
							{event?.fields?.image && (
								<Link
									className="flex-shrink-0"
									href={`/events/${event.fields.slug || event.id}`}
								>
									<CldImage
										className="flex-shrink-0"
										width={200}
										height={200}
										src={event.fields.image}
										alt={event.fields.title}
									/>
								</Link>
							)}
							<div className="w-full">
								<CardHeader className="mb-2 p-0">
									<CardTitle className="fluid-xl font-rounded font-semibold">
										<Link
											href={`/events/${event?.fields?.slug || event.id}`}
											className="w-full text-balance hover:underline"
										>
											{event?.fields?.title}
										</Link>
									</CardTitle>

									<div className="flex items-center gap-1 text-sm">
										{eventDate ? (
											<>
												<p>{eventDate}</p>
												<span className="opacity-50">・</span>
												<p>{eventTime} (PT)</p>
											</>
										) : (
											<p>Date TBD</p>
										)}
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
									<Contributor className="" />
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
