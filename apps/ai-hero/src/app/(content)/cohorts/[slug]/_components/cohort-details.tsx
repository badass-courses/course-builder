import * as React from 'react'
import Link from 'next/link'
import { Cohort } from '@/lib/cohort'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import {
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

export const CohortDetails: React.FC<{
	cohort: Cohort
}> = ({ cohort }) => {
	const { startsAt, endsAt, timezone } = cohort.fields

	const { dateString: eventDateString, timeString: eventTimeString } =
		formatCohortDateRange(startsAt, endsAt, timezone)
	const tz = timezone || 'America/Los_Angeles'

	// startsAt includes the date and time
	const pacificDateString =
		startsAt && formatInTimeZone(startsAt, tz, 'MMMM do, yyyy')
	const pacificTimeString = startsAt && formatInTimeZone(startsAt, tz, 'h:mm a')
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
		<div className="flex flex-col border-b p-5">
			<div className="flex flex-col gap-2.5 text-base font-normal">
				{eventDateString && (
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1 font-semibold">
							<CalendarIcon className="text-primary h-5 w-5 shrink-0" /> Date
						</span>{' '}
						<div className="opacity-90">{eventDateString}</div>
					</div>
				)}
				{eventTimeString && (
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1 font-semibold">
							<ClockIcon className="text-primary relative h-5 w-5 shrink-0" />{' '}
							Time{' '}
							{everyTimeZoneLink && (
								<>
									(
									<Link
										href={everyTimeZoneLink}
										target="_blank"
										className="text-primary underline underline-offset-2"
										rel="noopener noreferrer"
									>
										Timezones
									</Link>
									)
								</>
							)}
						</span>
						<div className="opacity-90">{eventTimeString}</div>
					</div>
				)}
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold">
						<MapPinIcon className="text-primary h-5 w-5" /> Location
					</span>{' '}
					<span className="opacity-90">Discord (online remote)</span>
				</div>
			</div>
		</div>
	)
}
