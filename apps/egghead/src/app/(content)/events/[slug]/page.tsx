import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCachedEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

interface EventPageProps {
	params: {
		slug: string
	}
}

export async function generateMetadata({
	params,
}: EventPageProps): Promise<Metadata> {
	const resolvedParams = await params
	const event = await getCachedEventOrEventSeries(resolvedParams.slug)

	if (!event) {
		return {
			title: 'Event Not Found',
		}
	}

	return {
		title: event.fields.title,
		description:
			event.fields.description || `Join us for ${event.fields.title}`,
		openGraph: {
			title: event.fields.title,
			description: event.fields.description,
			images: event.fields.socialImage ? [event.fields.socialImage.url] : [],
		},
	}
}

export default async function EventPage({ params }: EventPageProps) {
	const resolvedParams = await params
	const event = await getCachedEventOrEventSeries(resolvedParams.slug)
	const { session, ability } = await getServerAuthSession()

	if (!event) {
		notFound()
	}

	const isEventSeries = event.type === 'event-series'
	const canEdit = ability.can('update', 'Content')
	const canManage = ability.can('manage', 'Content')

	const startDate = event.fields.startsAt
		? new Date(event.fields.startsAt)
		: null
	const endDate = event.fields.endsAt ? new Date(event.fields.endsAt) : null
	const timezone = event.fields.timezone || 'America/Los_Angeles'
	const isPastEvent = endDate
		? endDate < new Date()
		: startDate
			? startDate < new Date()
			: false

	// Get child events if this is an event series
	const childEvents =
		isEventSeries && event.resources
			? event.resources.filter((r: any) => r.resource?.type === 'event')
			: []

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			{/* Admin actions */}
			{canEdit && (
				<div className="mb-4 flex justify-end gap-2">
					<Link href={`/events/${resolvedParams.slug}/edit`}>
						<Button variant="outline" size="sm">
							Edit Event
						</Button>
					</Link>
					{canManage && (
						<Link href={`/admin/events/${event.id}`}>
							<Button variant="outline" size="sm">
								Manage
							</Button>
						</Link>
					)}
				</div>
			)}

			{/* Event header */}
			<div className="mb-8">
				<h1 className="mb-4 text-4xl font-bold">{event.fields.title}</h1>
				{event.fields.description && (
					<p className="text-muted-foreground text-xl">
						{event.fields.description}
					</p>
				)}
			</div>

			{/* Event details card */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Event Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{!isEventSeries && startDate && (
						<>
							<div className="flex items-start gap-3">
								<CalendarIcon className="text-muted-foreground mt-0.5 h-5 w-5" />
								<div>
									<p className="font-medium">Date</p>
									<p className="text-muted-foreground text-sm">
										{format(startDate, 'EEEE, MMMM d, yyyy')}
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<ClockIcon className="text-muted-foreground mt-0.5 h-5 w-5" />
								<div>
									<p className="font-medium">Time</p>
									<p className="text-muted-foreground text-sm">
										{formatInTimeZone(startDate, timezone, 'h:mm a zzz')}
										{endDate &&
											` - ${formatInTimeZone(endDate, timezone, 'h:mm a')}`}
									</p>
								</div>
							</div>
						</>
					)}

					{event.fields.timezone && (
						<div className="flex items-start gap-3">
							<MapPinIcon className="text-muted-foreground mt-0.5 h-5 w-5" />
							<div>
								<p className="font-medium">Timezone</p>
								<p className="text-muted-foreground text-sm">{timezone}</p>
							</div>
						</div>
					)}

					{event.fields.quantity !== undefined &&
						event.fields.quantity !== null && (
							<div className="flex items-start gap-3">
								<UsersIcon className="text-muted-foreground mt-0.5 h-5 w-5" />
								<div>
									<p className="font-medium">Availability</p>
									<p className="text-muted-foreground text-sm">
										{event.fields.quantity === -1
											? 'Unlimited seats'
											: event.fields.quantity === 0
												? 'Sold out'
												: `${event.fields.quantity} seats available`}
									</p>
								</div>
							</div>
						)}

					{event.fields.price !== undefined && event.fields.price !== null && (
						<div className="flex items-start gap-3">
							<span className="mt-0.5 text-lg font-medium">$</span>
							<div>
								<p className="font-medium">Price</p>
								<p className="text-muted-foreground text-sm">
									{event.fields.price === 0
										? 'Free'
										: `$${event.fields.price.toFixed(2)}`}
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Event series - show child events */}
			{isEventSeries && childEvents.length > 0 && (
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Sessions in this Series</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{childEvents.map((childEvent: any, index: number) => {
								const child = childEvent.resource
								const childStart = child.fields?.startsAt
									? new Date(child.fields.startsAt)
									: null
								const childEnd = child.fields?.endsAt
									? new Date(child.fields.endsAt)
									: null

								return (
									<div
										key={child.id}
										className="border-primary/20 border-l-2 pl-4"
									>
										<h3 className="font-semibold">{child.fields?.title}</h3>
										{childStart && (
											<p className="text-muted-foreground mt-1 text-sm">
												{format(childStart, 'PPP')} at{' '}
												{formatInTimeZone(childStart, timezone, 'h:mm a zzz')}
												{childEnd &&
													` - ${formatInTimeZone(childEnd, timezone, 'h:mm a')}`}
											</p>
										)}
									</div>
								)
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Event body/description */}
			{event.fields.body && (
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>About this Event</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className="prose prose-sm max-w-none"
							dangerouslySetInnerHTML={{ __html: event.fields.body }}
						/>
					</CardContent>
				</Card>
			)}

			{/* Attendee instructions */}
			{event.fields.attendeeInstructions && (
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Instructions for Attendees</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className="prose prose-sm max-w-none"
							dangerouslySetInnerHTML={{
								__html: event.fields.attendeeInstructions,
							}}
						/>
					</CardContent>
				</Card>
			)}

			{/* Registration/purchase button */}
			{!isPastEvent && event.fields.quantity !== 0 && (
				<div className="flex justify-center">
					<Button size="lg" className="w-full sm:w-auto">
						{event.fields.price === 0 ? 'Register for Free' : 'Register Now'}
					</Button>
				</div>
			)}

			{isPastEvent && (
				<div className="bg-muted/50 rounded-lg p-6 text-center">
					<p className="text-muted-foreground">This event has already ended.</p>
				</div>
			)}

			{event.fields.quantity === 0 && !isPastEvent && (
				<div className="bg-muted/50 rounded-lg p-6 text-center">
					<p className="text-muted-foreground">This event is sold out.</p>
				</div>
			)}
		</div>
	)
}
