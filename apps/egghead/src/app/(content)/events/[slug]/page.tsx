import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

interface EventPageProps {
	params: { slug: string }
}

/**
 * @description Generate metadata for event pages
 */
export async function generateMetadata({
	params,
}: EventPageProps): Promise<Metadata> {
	const event = await getEventOrEventSeries(params.slug)

	if (!event) {
		return {
			title: 'Event Not Found',
		}
	}

	return {
		title: event.fields.title,
		description: event.fields.description || undefined,
		openGraph: {
			title: event.fields.title,
			description: event.fields.description || undefined,
			images: event.fields.image ? [event.fields.image] : undefined,
		},
	}
}

/**
 * @description Individual event detail page
 */
export default async function EventPage({ params }: EventPageProps) {
	const event = await getEventOrEventSeries(params.slug)
	const { session, ability } = await getServerAuthSession()

	if (!event) {
		notFound()
	}

	const canEdit = session?.user && ability.can('update', 'Content')

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
				{/* Header */}
				<div className="mb-8">
					{canEdit && (
						<div className="mb-4">
							<Link
								href={`/events/${event.fields.slug}/edit`}
								className="inline-flex items-center rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200"
							>
								Edit Event
							</Link>
						</div>
					)}

					<h1 className="mb-4 text-4xl font-bold">{event.fields.title}</h1>

					{(event.fields as any).startsAt && (
						<div className="text-muted-foreground mb-4 text-lg">
							📅{' '}
							{new Date((event.fields as any).startsAt).toLocaleDateString(
								'en-US',
								{
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									timeZoneName: 'short',
								},
							)}
						</div>
					)}
				</div>

				{/* Image */}
				{event.fields.image && (
					<div className="mb-8">
						<img
							src={event.fields.image}
							alt={event.fields.title}
							className="h-64 w-full rounded-lg object-cover"
						/>
					</div>
				)}

				{/* Description */}
				{event.fields.description && (
					<div className="mb-8">
						<h2 className="mb-4 text-2xl font-semibold">About This Event</h2>
						<div className="prose max-w-none">
							<p className="text-lg">{event.fields.description}</p>
						</div>
					</div>
				)}

				{/* Body/Details */}
				{event.fields.body && (
					<div className="mb-8">
						<h2 className="mb-4 text-2xl font-semibold">Details</h2>
						<div className="prose max-w-none">
							<div dangerouslySetInnerHTML={{ __html: event.fields.body }} />
						</div>
					</div>
				)}

				{/* Event Details */}
				<div className="mb-8 grid gap-8 md:grid-cols-2">
					<div>
						<h3 className="mb-4 text-xl font-semibold">Event Information</h3>
						<div className="space-y-2">
							{(event.fields as any).startsAt && (
								<div>
									<strong>Start:</strong>{' '}
									{new Date((event.fields as any).startsAt).toLocaleString()}
								</div>
							)}
							{(event.fields as any).endsAt && (
								<div>
									<strong>End:</strong>{' '}
									{new Date((event.fields as any).endsAt).toLocaleString()}
								</div>
							)}
							{(event.fields as any).timezone && (
								<div>
									<strong>Timezone:</strong> {(event.fields as any).timezone}
								</div>
							)}
						</div>
					</div>

					{/* Attendee Instructions */}
					{(event.fields as any).attendeeInstructions && (
						<div>
							<h3 className="mb-4 text-xl font-semibold">
								Instructions for Attendees
							</h3>
							<div className="prose">
								<p>{(event.fields as any).attendeeInstructions}</p>
							</div>
						</div>
					)}
				</div>

				{/* Event Series Information */}
				{event.type === 'event-series' && event.resources && (
					<div className="mb-8">
						<h3 className="mb-4 text-xl font-semibold">
							Events in this Series
						</h3>
						<div className="space-y-4">
							{event.resources.map((resourceRef) => {
								const childEvent = resourceRef.resource
								if (childEvent.type === 'event') {
									return (
										<div key={childEvent.id} className="rounded-lg border p-4">
											<h4 className="font-semibold">
												{childEvent.fields.title}
											</h4>
											{(childEvent.fields as any).startsAt && (
												<p className="text-muted-foreground text-sm">
													{new Date(
														(childEvent.fields as any).startsAt,
													).toLocaleDateString('en-US', {
														weekday: 'long',
														year: 'numeric',
														month: 'long',
														day: 'numeric',
														hour: 'numeric',
														minute: '2-digit',
													})}
												</p>
											)}
											{childEvent.fields.description && (
												<p className="mt-2 text-sm">
													{childEvent.fields.description}
												</p>
											)}
										</div>
									)
								}
								return null
							})}
						</div>
					</div>
				)}

				{/* Back to Events */}
				<div className="border-t pt-8">
					<Link
						href="/events"
						className="inline-flex items-center text-blue-600 hover:text-blue-800"
					>
						← Back to all events
					</Link>
				</div>
			</div>
		</div>
	)
}
