import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/trpc/react'
import { formatInTimeZone } from 'date-fns-tz'

import { useToast } from '@coursebuilder/ui'
import { ToastAction } from '@coursebuilder/ui/primitives/toast'

// TODO: Develop a mechanism to keep track of dismissed notifications

export const useLiveEventToastNotifier = () => {
	const { data: availableEvents, status } = api.events.get.useQuery()
	const { toast } = useToast()
	const params = useParams()
	const event = availableEvents && availableEvents[0]
	const timezone =
		event?.contentResource?.fields?.timezone || 'America/Los_Angeles'
	const startsAt = event?.contentResource?.fields?.startsAt
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), timezone, 'MMMM do')}`

	React.useEffect(() => {
		if (
			// If there are available events
			// If user is not on the event page
			// If user has not purchased the event
			availableEvents &&
			availableEvents.length > 0 &&
			params.slug !== event?.contentResource?.fields?.slug &&
			!event?.purchase
		) {
			toast({
				title: `New live event scheduled!`,
				// duration: Infinity,
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
							<strong>{event?.quantityAvailable} spots left.</strong>
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
	}, [availableEvents, event, params.slug, toast])
}
