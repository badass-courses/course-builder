import * as React from 'react'
import { Event } from '@/lib/events'
import {
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { formatInTimeZone } from 'date-fns-tz'

export const EventDetails: React.FC<{
	event: Event
}> = ({ event }) => {
	const { startsAt, endsAt, timezone } = event.fields
	const PT = 'America/Los_Angeles'
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM d, yyyy')}`

	const eventTime =
		startsAt &&
		endsAt &&
		`${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(
			new Date(endsAt),
			PT,
			'h:mm a',
		)}`

	interface GroupedEvents {
		[title: string]: {
			dates: string[]
			time: string
		}
	}

	return (
		<div className="flex flex-col border-t px-5 pt-5">
			<h3 className="font-heading pb-4 text-2xl font-bold">Event Details</h3>
			<div className="flex flex-col gap-2.5 text-base font-normal">
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-light opacity-90">
						<CalendarIcon className="h-5 w-5 shrink-0 opacity-50" /> Date
					</span>{' '}
					{eventDate}
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-light opacity-90">
						<ClockIcon className="relative h-5 w-5 shrink-0 opacity-50" /> Time
					</span>
					<div>
						{eventTime} (Pacific time){' '}
						{/* {timezone && (
							<a
								href={timezone}
								rel="noopener noreferrer"
								target="_blank"
								className="font-normal underline"
							>
								timezones
							</a>
						)} */}
					</div>
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
