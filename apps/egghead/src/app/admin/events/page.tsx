import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
	getActiveEvents,
	getAllEvents,
	getPastEventIds,
} from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'
import { format } from 'date-fns'
import { CalendarIcon, PlusCircleIcon } from 'lucide-react'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'Admin - Manage Events',
	description: 'Manage all events',
}

export default async function AdminEventsPage() {
	const { session, ability } = await getServerAuthSession()

	if (!ability.can('manage', 'Content')) {
		redirect('/')
	}

	try {
		const [allEvents, activeEvents, pastEventIds] = await Promise.all([
			getAllEvents(),
			getActiveEvents(),
			getPastEventIds(),
		])

		const pastEvents = allEvents?.filter((event) =>
			pastEventIds.includes(event.id),
		)

		const renderEventCard = (event: any, isPast = false) => (
			<Card key={event.id}>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-2">
								<CardTitle>{event.fields.title}</CardTitle>
								{isPast && <Badge variant="secondary">Past</Badge>}
							</div>
							<p className="text-muted-foreground mt-1 text-sm">
								{event.type === 'event-series'
									? 'Event Series'
									: 'Single Event'}
							</p>
						</div>
						<div className="flex gap-2">
							<Link href={`/admin/events/${event.fields.slug}`}>
								<Button variant="outline" size="sm">
									View
								</Button>
							</Link>
							<Link href={`/admin/events/${event.fields.slug}/edit`}>
								<Button variant="outline" size="sm">
									Edit
								</Button>
							</Link>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div>
							<p className="text-muted-foreground">State</p>
							<p className="font-medium capitalize">
								{event.fields.state || 'draft'}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Visibility</p>
							<p className="font-medium capitalize">
								{event.fields.visibility || 'unlisted'}
							</p>
						</div>
						{event.fields.startsAt && (
							<div>
								<p className="text-muted-foreground">Start Date</p>
								<p className="font-medium">
									{format(new Date(event.fields.startsAt), 'PP')}
								</p>
							</div>
						)}
						{event.fields.price !== undefined && (
							<div>
								<p className="text-muted-foreground">Price</p>
								<p className="font-medium">
									{event.fields.price === 0 ? 'Free' : `$${event.fields.price}`}
								</p>
							</div>
						)}
						{event.fields.quantity !== undefined && (
							<div>
								<p className="text-muted-foreground">Capacity</p>
								<p className="font-medium">
									{event.fields.quantity === -1
										? 'Unlimited'
										: `${event.fields.quantity} seats`}
								</p>
							</div>
						)}
						<div>
							<p className="text-muted-foreground">Created</p>
							<p className="font-medium">
								{format(new Date(event.createdAt), 'PP')}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		)

		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="text-3xl font-bold">Manage Events</h1>
					<Link href="/events/new">
						<Button>
							<PlusCircleIcon className="mr-2 h-4 w-4" />
							Create Event
						</Button>
					</Link>
				</div>

				{allEvents?.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center">
							<CalendarIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<h2 className="mb-2 text-xl font-semibold">No events yet</h2>
							<p className="text-muted-foreground mb-4">
								Create your first event to get started
							</p>
							<Link href="/events/new">
								<Button>Create Event</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-8">
						{/* Active Events Section */}
						{activeEvents?.length > 0 && (
							<div>
								<div className="mb-4 flex items-center gap-2">
									<h2 className="text-xl font-semibold">Active Events</h2>
									<Badge variant="default">{activeEvents?.length}</Badge>
								</div>
								<div className="space-y-4">
									{activeEvents?.map((event) => renderEventCard(event))}
								</div>
							</div>
						)}

						{/* Past Events Section */}
						{pastEvents?.length > 0 && (
							<div>
								<div className="mb-4 flex items-center gap-2">
									<h2 className="text-xl font-semibold">Past Events</h2>
									<Badge variant="secondary">{pastEvents.length}</Badge>
								</div>
								<div className="space-y-4">
									{pastEvents.map((event) => renderEventCard(event, true))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		)
	} catch (error) {
		console.error('Error loading events page:', error)
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="text-3xl font-bold">Manage Events</h1>
					<Link href="/events/new">
						<Button>
							<PlusCircleIcon className="mr-2 h-4 w-4" />
							Create Event
						</Button>
					</Link>
				</div>

				<Card>
					<CardContent className="py-12 text-center">
						<CalendarIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
						<h2 className="mb-2 text-xl font-semibold">
							Database Connection Issue
						</h2>
						<p className="text-muted-foreground mb-4">
							There was an issue loading events from the database. You can still
							create new events.
						</p>
						<Link href="/events/new">
							<Button>Create Event</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		)
	}
}
