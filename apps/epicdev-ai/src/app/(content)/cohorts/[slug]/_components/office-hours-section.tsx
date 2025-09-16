'use client'

import * as React from 'react'
import Link from 'next/link'
import { OfficeHourEvent } from '@/lib/cohort'
import { format, isPast } from 'date-fns'
import { Calendar, Clock, Edit, Users } from 'lucide-react'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

interface OfficeHoursSectionProps {
	events: OfficeHourEvent[]
	hasPurchased?: boolean
	canEdit?: boolean
}

export function OfficeHoursSection({
	events,
	hasPurchased = false,
	canEdit = false,
}: OfficeHoursSectionProps) {
	if (!events || events.length === 0) {
		return null
	}

	// Separate upcoming and past events
	const now = new Date()
	const upcomingEvents = events.filter(
		(event) => !isPast(new Date(event.startsAt)),
	)
	const pastEvents = events.filter((event) => isPast(new Date(event.startsAt)))

	return (
		<div className="mt-10">
			<div className="mb-6 flex items-center gap-3">
				<Users className="text-primary size-6" />
				<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					Office Hours
				</h2>
				<Badge variant="secondary" className="text-xs">
					{events.length} sessions
				</Badge>
			</div>

			<div className="space-y-4">
				{upcomingEvents.length > 0 && (
					<div>
						<h3 className="text-muted-foreground mb-3 text-lg font-medium">
							Upcoming Sessions
						</h3>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
							{upcomingEvents.map((event) => (
								<OfficeHourEventCard
									key={event.id}
									event={event}
									hasPurchased={hasPurchased}
									canEdit={canEdit}
								/>
							))}
						</div>
					</div>
				)}

				{pastEvents.length > 0 && (
					<div>
						<h3 className="text-muted-foreground mb-3 text-lg font-medium">
							Past Sessions
						</h3>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
							{pastEvents.slice(0, 3).map((event) => (
								<OfficeHourEventCard
									key={event.id}
									event={event}
									hasPurchased={hasPurchased}
									canEdit={canEdit}
									isPast={true}
								/>
							))}
						</div>
						{pastEvents.length > 3 && (
							<p className="text-muted-foreground mt-2 text-sm">
								And {pastEvents.length - 3} more past sessions...
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

interface OfficeHourEventCardProps {
	event: OfficeHourEvent
	hasPurchased?: boolean
	canEdit?: boolean
	isPast?: boolean
}

function OfficeHourEventCard({
	event,
	hasPurchased = false,
	canEdit = false,
	isPast = false,
}: OfficeHourEventCardProps) {
	const startDate = new Date(event.startsAt)
	const endDate = new Date(event.endsAt)
	const duration = Math.round(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60),
	) // duration in minutes

	return (
		<Card className={isPast ? 'opacity-60' : ''}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="text-base font-medium">
							{event.title}
						</CardTitle>
						<CardDescription className="text-sm">
							{format(startDate, 'EEEE, MMMM d, yyyy')}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						{canEdit && (
							<Button asChild size="sm" variant="ghost" className="size-8 p-0">
								<Link
									href={`/events/${event.id}/edit`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Edit className="size-4" />
									<span className="sr-only">Edit office hours event</span>
								</Link>
							</Button>
						)}
						<Badge variant={isPast ? 'outline' : 'default'} className="text-xs">
							{isPast ? 'Completed' : event.status}
						</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="text-muted-foreground space-y-2 text-sm">
					<div className="flex items-center gap-2">
						<Clock className="size-4" />
						<span>
							{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
						</span>
						<span className="text-xs">({duration} min)</span>
					</div>

					{event.description && <p className="text-sm">{event.description}</p>}

					{hasPurchased && event.attendeeInstructions && (
						<div className="bg-muted mt-3 rounded-md p-3">
							<p className="text-muted-foreground mb-1 text-xs font-medium">
								For Attendees:
							</p>
							<p className="text-sm">{event.attendeeInstructions}</p>
						</div>
					)}

					{!hasPurchased && !isPast && (
						<div className="bg-muted mt-3 rounded-md p-3">
							<p className="text-muted-foreground text-xs font-medium">
								Purchase the cohort to access office hours
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
