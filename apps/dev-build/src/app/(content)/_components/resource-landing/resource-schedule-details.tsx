'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import {
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

type ScheduleConfig = {
	startsAt?: string | null
	endsAt?: string | null
	timezone?: string | null
}

export type ResourceScheduleDetailsProps = {
	/** Schedule configuration with start/end dates */
	schedule: ScheduleConfig
	/** Location text - defaults to online remote message */
	location?: string | null
	/** Whether to show the location section */
	showLocation?: boolean
	/** Additional CSS classes */
	className?: string
}

const DEFAULT_LOCATION = 'Online (remote)'

/**
 * Displays schedule details (date, time, location) for events and cohorts.
 *
 * Uses formatCohortDateRange to correctly handle:
 * - Same day events: shows date and time range (e.g., "Dec 19" | "3:00 PM — 4:00 PM PT")
 * - Multi-day events: shows date range and start time (e.g., "Dec 10—Jan 11" | "3:00 PM PT")
 *
 * Includes timezone conversion link for time display.
 */
export function ResourceScheduleDetails({
	schedule,
	location = DEFAULT_LOCATION,
	showLocation = true,
	className,
}: ResourceScheduleDetailsProps) {
	const { startsAt, endsAt, timezone } = schedule
	const tz = timezone || 'America/Los_Angeles'

	if (!startsAt) {
		return null
	}

	// Use the shared date formatting logic that handles same-day vs multi-day correctly
	const { dateString, timeString } = formatCohortDateRange(startsAt, endsAt, tz)

	// Build timezone conversion link using start date/time
	const pacificDateString = formatInTimeZone(
		new Date(startsAt),
		tz,
		'MMMM do, yyyy',
	)
	const pacificTimeString = formatInTimeZone(new Date(startsAt), tz, 'h:mm a')

	// Handle temporary timezone offset if needed
	const originalStartDate = new Date(startsAt)
	const startDateOneDayLater = format(
		addDays(originalStartDate, 1),
		'MMMM do, yyyy',
	)

	const everyTimeZoneLink = buildEtzLink(
		process.env.NEXT_PUBLIC_TEMPORARY_TIMEZONE_OFFSET === 'true'
			? startDateOneDayLater
			: pacificDateString,
		pacificTimeString,
	)

	return (
		<div
			className={cn(
				'dark:border-foreground/5 flex flex-col border-b p-6',
				className,
			)}
		>
			<div className="flex flex-col gap-3 text-base font-normal">
				{/* Date */}
				{dateString && (
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
							<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
							Date
						</span>
						<div className="text-foreground/90 dark:text-foreground">
							{dateString}
						</div>
					</div>
				)}

				{/* Time */}
				{timeString && (
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
						<div className="text-foreground/90 dark:text-foreground">
							{timeString}
						</div>
					</div>
				)}

				{/* Location */}
				{showLocation && location && (
					<div className="flex flex-col">
						<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
							<MapPinIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
							Location
						</span>
						<p className="text-foreground/90 dark:text-foreground">
							{location}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}

type ResourceScheduleDetailsMobileProps = {
	/** Schedule configuration with start/end dates */
	schedule: ScheduleConfig
	/** Button text - defaults to "Buy Now" */
	buttonText?: string
	/** Button href - defaults to "#buy" */
	buttonHref?: string
	/** Additional CSS classes */
	className?: string
}

/**
 * Compact mobile version of schedule details for floating CTA.
 * Includes a CTA button for the mobile floating bar.
 *
 * Uses formatCohortDateRange with short=true for compact display.
 */
export function ResourceScheduleDetailsMobile({
	schedule,
	buttonText = 'Buy Now',
	buttonHref = '#buy',
	className,
}: ResourceScheduleDetailsMobileProps) {
	const { startsAt, endsAt, timezone } = schedule
	const tz = timezone || 'America/Los_Angeles'

	if (!startsAt) {
		return null
	}

	// Use short format for mobile (e.g., "Dec 10—Jan 11" instead of "December 10—January 11")
	const { dateString, timeString } = formatCohortDateRange(
		startsAt,
		endsAt,
		tz,
		true, // short format
	)

	return (
		<div
			className={cn(
				'flex w-full flex-row items-center justify-between gap-2 text-sm',
				className,
			)}
		>
			<div className="flex flex-col gap-1">
				{dateString && (
					<div className="flex flex-row items-center gap-1 font-medium">
						<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" />
						{dateString}
					</div>
				)}
				{timeString && <div>{timeString}</div>}
			</div>
			<Button variant="secondary" asChild>
				<Link href={buttonHref}>{buttonText}</Link>
			</Button>
		</div>
	)
}
