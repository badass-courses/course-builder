import * as React from 'react'
import { Event } from '@/lib/events'
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
		<div className="mt-5 flex flex-col border-t pt-5">
			<h2 className="px-5 pb-4 text-xl font-semibold">Event Details</h2>

			<div className="flex flex-col text-base font-semibold opacity-90">
				<div className="flex items-center gap-2 px-5 py-2">
					{/*<CalendarIcon className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-blue-300" />{' '}*/}
					{eventDate}
				</div>
				<div className="flex items-baseline gap-2 px-5 py-2">
					{/*<ClockIcon className="relative h-5 w-5 flex-shrink-0 translate-y-1 text-gray-600 dark:text-blue-300" />{' '}*/}
					<div>
						{eventTime} (Pacific time){' '}
						{timezone && (
							<a
								href={timezone}
								rel="noopener noreferrer"
								target="_blank"
								className="font-normal underline"
							>
								timezones
							</a>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2 px-5 py-2">
					{/*<LocationMarkerIcon className="h-5 w-5 text-gray-600 dark:text-blue-300" />{' '}*/}
					Zoom (online remote)
				</div>
			</div>
		</div>
	)
}
