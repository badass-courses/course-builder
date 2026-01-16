import * as React from 'react'
import Link from 'next/link'
import { Event } from '@/lib/events'
import {
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

export const EventDetails: React.FC<{
	event: Event
}> = ({ event }) => {
	const { startsAt, endsAt } = event.fields
	const PT = 'America/Los_Angeles'
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM do, yyyy')}`

	const eventTime =
		startsAt &&
		endsAt &&
		`${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(
			new Date(endsAt),
			PT,
			'h:mm a',
		)}`

	const pacificDateString =
		startsAt && formatInTimeZone(new Date(startsAt), PT, 'MMMM do, yyyy')
	const pacificTimeString =
		startsAt && formatInTimeZone(new Date(startsAt), PT, 'h:mm a')
	const originalStartDate = startsAt && new Date(startsAt)
	const startDateOneDayLater =
		originalStartDate && format(addDays(originalStartDate, 1), 'MMMM do, yyyy')

	const everyTimeZoneLink =
		pacificDateString &&
		pacificTimeString &&
		startDateOneDayLater &&
		buildEtzLink(
			process.env.NEXT_PUBLIC_TEMPORARY_TIMEZONE_OFFSET === 'true'
				? startDateOneDayLater
				: pacificDateString,
			pacificTimeString,
		)

	return (
		<div className="flex flex-col border-t px-5 pb-10 pt-5">
			<h3 className="pb-4 text-xl font-semibold">Event Details</h3>
			<div className="flex flex-col gap-2.5 text-base font-normal">
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-light opacity-90">
						<CalendarIcon className="h-5 w-5 shrink-0 opacity-50" /> Date
					</span>{' '}
					{eventDate}
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-light opacity-90">
						<ClockIcon className="relative h-5 w-5 shrink-0 opacity-50" />{' '}
						Time{' '}
					</span>
					<div>{eventTime} (Pacific time)</div>
					{everyTimeZoneLink && (
						<div>
							<Link
								href={everyTimeZoneLink}
								target="_blank"
								className="decoration-foreground/50 hover:text-primary underline underline-offset-2"
								rel="noopener noreferrer"
							>
								Timezones
							</Link>
						</div>
					)}
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-light opacity-90">
						<MapPinIcon className="h-5 w-5 opacity-50" /> Location
					</span>{' '}
					Zoom (online remote)
				</div>
			</div>
		</div>
	)
}
