import * as React from 'react'
import Link from 'next/link'
import { Event } from '@/lib/events'
import {
	CalendarIcon,
	ClockIcon,
	GlobeAmericasIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { cn } from '@coursebuilder/ui/utils/cn'
import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

export const EventDetails: React.FC<{
	event: Event
}> = ({ event }) => {
	const { startsAt, endsAt, timezone } = event.fields
	const PT = 'America/Los_Angeles'
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM do, yyyy')}`
	console.log({ startsAt, endsAt, timezone })
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

	// startsAt includes the date and time
	const pacificDateString =
		startsAt && formatInTimeZone(startsAt, PT, 'MMMM do, yyyy')
	const pacificTimeString = startsAt && formatInTimeZone(startsAt, PT, 'h:mm a')
	const everyTimeZoneLink =
		pacificDateString &&
		pacificTimeString &&
		buildEtzLink(pacificDateString, pacificTimeString)

	return (
		<div
			className={cn('flex flex-col p-6', {
				'border-b': event.resourceProducts.length > 0,
			})}
		>
			{/* <h3 className="font-heading pb-4 text-2xl font-bold">Event Details</h3> */}
			<div className="flex flex-col gap-3 text-base font-normal">
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" /> Date
					</span>{' '}
					{eventDate}
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<ClockIcon className="text-primary relative h-5 w-5 flex-shrink-0" />{' '}
						Time{' '}
						{everyTimeZoneLink && (
							<Link
								href={everyTimeZoneLink}
								target="_blank"
								className="text-primary underline underline-offset-2"
								rel="noopener noreferrer"
							>
								(Timezones)
							</Link>
						)}
					</span>
					<div>{eventTime} (Pacific time) </div>
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<MapPinIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
						Location
					</span>{' '}
					Online (remote) - You'll receive a calendar invite with a link to the
					event in your confirmation email.
				</div>
			</div>
		</div>
	)
}
