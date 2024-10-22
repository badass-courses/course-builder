import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/trpc/react'
import cookieUtil from '@/utils/cookies'
import { isBefore, subDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import pluralize from 'pluralize'

import { useToast } from '@coursebuilder/ui'
import { ToastAction } from '@coursebuilder/ui/primitives/toast'

export const useLiveEventToastNotifier = () => {
	const DAYS_TO_WAIT_BETWEEN_SHOWING_DISMISSED_PROMOTION = 2

	const { data: availableEvents, status } = api.events.get.useQuery()
	const { toast } = useToast()
	const params = useParams()
	const event = availableEvents && availableEvents[0]
	const timezone =
		event?.contentResource?.fields?.timezone || 'America/Los_Angeles'
	const startsAt = event?.contentResource?.fields?.startsAt
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), timezone, 'MMMM do')}`

	const eventCookieName = `event_${event?.id}`
	const eventCookie = event && cookieUtil.get(eventCookieName)
	const lastDismissed = eventCookie?.dismissed_on
	const thresholdDays = subDays(
		new Date(),
		DAYS_TO_WAIT_BETWEEN_SHOWING_DISMISSED_PROMOTION,
	)
	const dismissedButThresholdExceeded = lastDismissed
		? isBefore(new Date(lastDismissed), thresholdDays)
		: true

	React.useEffect(() => {
		if (
			// If there are available events
			// If user is not on the event page
			// If user has not purchased the event
			event &&
			event.quantityAvailable > 0 &&
			params.slug !== event?.contentResource?.fields?.slug &&
			!event?.purchase &&
			dismissedButThresholdExceeded
		) {
			toast({
				title: `New live event scheduled!`,
				duration: Infinity,
				onDismiss: () => {
					cookieUtil.set(eventCookieName, {
						dismissed_on: new Date(),
					})
				},
				description: (
					<>
						<p>
							Join us for{' '}
							<strong className="text-primary">
								{event?.contentResource?.fields?.title}
							</strong>{' '}
							on {eventDate}.
						</p>
						<p>
							<strong>
								{event?.quantityAvailable}{' '}
								{pluralize('spot', event?.quantityAvailable)} left.
							</strong>
						</p>
					</>
				),
				action: (
					<ToastAction altText="Learn more" asChild>
						<Link href={`/events/${event?.contentResource?.fields?.slug}`}>
							Learn more
						</Link>
					</ToastAction>
				),
			})
		}
	}, [event, params.slug, dismissedButThresholdExceeded, toast])
}
