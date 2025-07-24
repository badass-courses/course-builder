'use client'

import * as React from 'react'
import Link from 'next/link'
import { createAppAbility } from '@/ability'
import { Event } from '@/lib/events'
import { api } from '@/trpc/react'
import {
	CalendarIcon,
	ClockIcon,
	GlobeAmericasIcon,
	MapPinIcon,
} from '@heroicons/react/24/outline'
import { addDays, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Pen } from 'lucide-react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'
import { buildEtzLink } from '@coursebuilder/utils-timezones/build-etz-link'

export const EventDetails: React.FC<{
	events: Event[]
}> = ({ events }) => {
	if (!events || events.length === 0) {
		return null
	}

	const PT = 'America/Los_Angeles'
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])
	const canEdit = ability.can('create', 'Content')

	if (events.length > 1) {
		const groupedEvents = events.reduce(
			(
				acc: Record<
					string,
					{
						date: string
						time: string
						location: string
						title: string | undefined
						description: string | undefined
						image: any
						slug: string
					}
				>,
				event,
			) => {
				const { startsAt, endsAt, slug } = event.fields
				if (!startsAt || !endsAt) {
					return acc
				}
				const eventDate = `${formatInTimeZone(new Date(startsAt), PT, 'MMMM do, yyyy')}`
				const eventTime = `${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(new Date(endsAt), PT, 'h:mm a')}`
				const eventLocation =
					'Online (remote) - A calendar invite will be sent to your email when you purchase.'
				const eventTitle = event.fields.title
				const eventDescription = event.fields.description
				const eventImage = event.fields.image

				acc[eventDate] = {
					date: eventDate,
					time: eventTime,
					location: eventLocation,
					title: eventTitle,
					description: eventDescription,
					image: eventImage,
					slug: slug,
				}
				return acc
			},
			{},
		)

		return (
			<div
				className={cn('dark:border-foreground/5 flex flex-col border-b p-6')}
			>
				<div className="flex flex-col gap-6">
					{Object.values(groupedEvents).map((eventData, index) => (
						<div
							key={index}
							className="flex flex-col gap-3 text-base font-normal"
						>
							<h3 className="text-lg font-semibold">
								{eventData.title}{' '}
								{canEdit && (
									<Link
										target="_blank"
										href={getResourcePath('event', eventData.slug, 'edit')}
										className="text-primary ml-1 inline-flex items-baseline gap-0.5 text-base font-medium hover:underline"
									>
										<Pen className="size-3" /> edit
									</Link>
								)}
							</h3>

							<div className="flex flex-col">
								<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
									<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
									Date
								</span>
								<div className="dark:text-foreground text-foreground/90">
									{eventData.date}
								</div>
							</div>
							<div className="flex flex-col">
								<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
									<ClockIcon className="text-primary relative h-5 w-5 flex-shrink-0" />{' '}
									Time
								</span>
								<div className="dark:text-foreground text-foreground/90">
									{eventData.time} (Pacific time)
								</div>
							</div>
							{/* <div className="flex flex-col">
								<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
									<MapPinIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
									Location
								</span>
								<p className="dark:text-foreground text-foreground/90">
									{eventData.location}
								</p>
							</div> */}
						</div>
					))}
					<div className="border-foreground/10 flex flex-col border-t pt-5">
						<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
							<MapPinIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
							Location
						</span>
						<p className="dark:text-foreground text-foreground/90">
							Online (remote) - A calendar invites will be sent to your email
							when you purchase.
						</p>
					</div>
				</div>
			</div>
		)
	}

	// Single event case
	const singleEvent = events[0]
	if (!singleEvent?.fields) {
		return null
	}

	const { startsAt, endsAt } = singleEvent.fields
	if (!startsAt || !endsAt) {
		return null
	}

	const singleEventDate = `${formatInTimeZone(new Date(startsAt), PT, 'MMMM do, yyyy')}`
	const singleEventTime = `${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(new Date(endsAt), PT, 'h:mm a')}`

	// startsAt includes the date and time
	const pacificDateString = formatInTimeZone(
		new Date(startsAt),
		PT,
		'MMMM do, yyyy',
	)
	const pacificTimeString = formatInTimeZone(new Date(startsAt), PT, 'h:mm a')
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
		<div className={cn('dark:border-foreground/5 flex flex-col border-b p-6')}>
			<div className="flex flex-col gap-3 text-base font-normal">
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<CalendarIcon className="text-primary h-5 w-5 flex-shrink-0" /> Date
					</span>
					<div className="dark:text-foreground text-foreground/90">
						{singleEventDate}
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
						{singleEventTime} (Pacific time)
					</div>
				</div>
				<div className="flex flex-col">
					<span className="inline-flex items-center gap-1 font-semibold opacity-90 dark:text-white">
						<MapPinIcon className="text-primary h-5 w-5 flex-shrink-0" />{' '}
						Location
					</span>
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
