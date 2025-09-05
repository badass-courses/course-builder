import { Metadata } from 'next'
import Link from 'next/link'
import { getActiveEvents, getAllEvents } from '@/lib/events-query'
import { format } from 'date-fns'
import { CalendarIcon, ClockIcon, UsersIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'Events',
	description: 'Upcoming workshops, webinars, and live sessions',
}

export default async function EventsPage() {
	const events = await getActiveEvents()
	const allEvents = await getAllEvents()
	const pastEvents = allEvents?.filter((event) => {
		const now = new Date()
		if (event.fields.endsAt) {
			return new Date(event.fields.endsAt) < now
		}
		if (event.fields.startsAt) {
			return new Date(event.fields.startsAt) < now
		}
		return false
	})

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-4xl font-bold">Events</h1>
				<p className="text-muted-foreground mt-2">
					Join us for live workshops, webinars, and interactive sessions
				</p>
			</div>

			{events?.length > 0 ? (
				<div className="space-y-8">
					<section>
						<h2 className="mb-4 text-2xl font-semibold">Upcoming Events</h2>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{events?.map((event) => (
								<EventCard key={event.id} event={event} />
							))}
						</div>
					</section>

					{pastEvents.length > 0 && (
						<section className="mt-12">
							<h2 className="text-muted-foreground mb-4 text-2xl font-semibold">
								Past Events
							</h2>
							<div className="grid gap-4 opacity-60 md:grid-cols-2 lg:grid-cols-3">
								{pastEvents.slice(0, 6).map((event) => (
									<EventCard key={event.id} event={event} isPast />
								))}
							</div>
						</section>
					)}
				</div>
			) : (
				<div className="py-12 text-center">
					<CalendarIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
					<h2 className="mb-2 text-xl font-semibold">No upcoming events</h2>
					<p className="text-muted-foreground">
						Check back soon for new events!
					</p>
				</div>
			)}
		</div>
	)
}

function EventCard({
	event,
	isPast = false,
}: {
	event: any
	isPast?: boolean
}) {
	const startDate = event.fields.startsAt
		? new Date(event.fields.startsAt)
		: null
	const endDate = event.fields.endsAt ? new Date(event.fields.endsAt) : null

	return (
		<Link href={`/admin/events/${event.fields.slug}`}>
			<Card
				className={`transition-shadow hover:shadow-lg ${isPast ? 'opacity-60' : ''}`}
			>
				<CardHeader>
					<CardTitle className="line-clamp-2">{event.fields.title}</CardTitle>
				</CardHeader>
				<CardContent>
					{event.fields.description && (
						<p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
							{event.fields.description}
						</p>
					)}
					<div className="space-y-2 text-sm">
						{startDate && (
							<div className="flex items-center gap-2">
								<CalendarIcon className="h-4 w-4" />
								<span>{format(startDate, 'PPP')}</span>
							</div>
						)}
						{startDate && (
							<div className="flex items-center gap-2">
								<ClockIcon className="h-4 w-4" />
								<span>{format(startDate, 'p')}</span>
								{endDate && <span>- {format(endDate, 'p')}</span>}
							</div>
						)}
						{event.fields.quantity && event.fields.quantity > 0 && (
							<div className="flex items-center gap-2">
								<UsersIcon className="h-4 w-4" />
								<span>{event.fields.quantity} seats available</span>
							</div>
						)}
					</div>
					{isPast && (
						<div className="text-muted-foreground mt-4 text-xs font-semibold">
							PAST EVENT
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}
