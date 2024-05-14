import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'Live Events & Workshops hosted by Adam Elmore',
}

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()

	return (
		<>
			<main className="container relative flex h-full min-h-[calc(100vh-var(--nav-height))] flex-col items-center lg:border-x">
				<div className=" w-full max-w-screen-md border-b py-16 md:border-dashed">
					<h1 className="font-heading text-center text-5xl font-bold">
						<span className="text-stroke-1 text-stroke-primary text-stroke-fill-background">
							Live
						</span>{' '}
						<span className="text-gray-100">Events & Workshops</span>
					</h1>
				</div>
				<EventsList />
				{ability.can('update', 'Content') ? (
					<div className="mx-auto mt-10 flex w-full max-w-screen-md items-center justify-center border-t border-dashed py-10">
						<Button asChild variant="secondary">
							<Link href={`/events/new`}>New Event</Link>
						</Button>
					</div>
				) : null}
				<div
					className="absolute top-0 -z-10 h-full w-full max-w-screen-md border-dashed md:border-x"
					aria-hidden="true"
				/>
			</main>
			{/* <div>
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/events/new`}>New Event</Link>
					</Button>
				</div>
			) : null}
			<div className="flex flex-col space-y-4 p-5 sm:p-10">
				<h2 className="text-lg font-bold">Events</h2>
				{events.map((event) => (
					<Card key={event.id}>
						<CardHeader>
							<CardTitle>
								<Link href={`/events/${event.fields?.slug || event.id}`}>
									{event.fields?.title}
								</Link>
							</CardTitle>
						</CardHeader>
						<CardContent></CardContent>
					</Card>
				))}
			</div>
		</div> */}
		</>
	)
}

async function EventsList() {
	const { ability } = await getServerAuthSession()
	const eventsModule = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'event'),
	})
	const events = [...eventsModule].filter((event) => {
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
		<ul className="mx-auto mt-8 flex w-full max-w-screen-md flex-col gap-5 md:px-8">
			{publicEvents.length === 0 && <p>There are no public events.</p>}
			{events.map((event) => (
				<li key={event.id}>
					<Card className="bg-background flex flex-col items-center gap-3 rounded-none border-none p-0 md:flex-row">
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
							<CardHeader className="p-0">
								<CardTitle className="text-lg font-normal text-gray-100 sm:text-2xl">
									<h2>
										<Link
											href={`/events/${event?.fields?.slug || event.id}`}
											className="w-full text-balance hover:underline"
										>
											{event?.fields?.title}
										</Link>
									</h2>
								</CardTitle>
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
			))}
		</ul>
	)
}
