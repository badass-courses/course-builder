import * as React from 'react'
import { Cohort } from '@/lib/cohort'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import {
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'

export const CohortDetails: React.FC<{
	cohort: Cohort
}> = ({ cohort }) => {
	const { startsAt, endsAt, timezone } = cohort.fields

	const { dateString: eventDateString, timeString: eventTimeString } =
		formatCohortDateRange(startsAt, endsAt, timezone)

	return (
		<div className="flex flex-col border-t px-5 pt-5">
			<h3 className="font-heading pb-4 text-2xl font-bold">Cohort Details</h3>
			<div className="flex flex-col gap-2.5 text-base font-normal">
				{eventDateString && (
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1 font-light opacity-90">
							<CalendarIcon className="h-5 w-5 flex-shrink-0 opacity-50" /> Date
						</span>{' '}
						{eventDateString}
					</div>
				)}
				{eventTimeString && (
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1 font-light opacity-90">
							<ClockIcon className="relative h-5 w-5 flex-shrink-0 opacity-50" />{' '}
							Time
						</span>
						<div>{eventTimeString}</div>
					</div>
				)}
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
