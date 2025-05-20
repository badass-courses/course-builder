import * as React from 'react'
import Link from 'next/link'
import { Event } from '@/lib/events'
import {
	CalendarIcon,
	ClockIcon,
	GlobeAmericasIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { Button } from '@coursebuilder/ui'
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
		<div className={cn('flex flex-col p-6')}>
			{/* <h3 className="font-heading pb-4 text-2xl font-bold">Event Details</h3> */}
			<div className="flex flex-col gap-3 text-base font-normal">
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" /> Date
					</span>{' '}
					<div className="dark:text-foreground text-foreground/90">
						{eventDate}
					</div>
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
					<div className="dark:text-foreground text-foreground/90">
						{eventTime} (Pacific time){' '}
					</div>
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<MapPinIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
						Location
					</span>{' '}
					<p className="dark:text-foreground text-foreground/90">
						Online (remote) - A calendar invite will be sent to your email when
						you purchase.
					</p>
				</div>
			</div>
		</div>
	)
}

export const EventDetailsMobile: React.FC<{
	event: Event
}> = ({ event }) => {
	const { startsAt, endsAt, timezone } = event.fields
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
			className={cn('flex w-full flex-row justify-between gap-2 text-sm', {})}
		>
			<div className="flex flex-col gap-1">
				<div className="flex flex-row items-center gap-1">
					<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" />
					{eventDate}
				</div>
				<div className="">{eventTime} (PT) </div>
			</div>
			<Button variant="secondary" asChild>
				<Link href="#buy">Buy Ticket</Link>
			</Button>
		</div>
	)
}
