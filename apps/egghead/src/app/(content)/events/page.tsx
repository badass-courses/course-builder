import { Metadata } from 'next'
import Link from 'next/link'
import { getActiveEvents } from '@/lib/events-query'

export const metadata: Metadata = {
	title: 'Events',
	description: 'Browse upcoming events and workshops',
}

/**
 * @description Events listing page showing all active/upcoming events
 */
export default async function EventsPage() {
	const events = await getActiveEvents()

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="mb-4 text-3xl font-bold">Events</h1>
				<p className="text-muted-foreground mb-6 text-lg">
					Join us for live workshops, webinars, and educational events.
				</p>
			</div>

			{events.length === 0 ? (
				<div className="py-12 text-center">
					<h2 className="mb-2 text-xl font-semibold">No upcoming events</h2>
					<p className="text-muted-foreground">
						Check back soon for new events and workshops.
					</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{events.map((event) => (
						<Link
							key={event.id}
							href={`/events/${event.fields.slug}`}
							className="group block"
						>
							<div className="hover:bg-muted/50 h-full rounded-lg border p-6 transition-colors">
								{event.fields.image && (
									<div className="mb-4">
										<img
											src={event.fields.image}
											alt={event.fields.title}
											className="h-32 w-full rounded object-cover"
										/>
									</div>
								)}
								<h3 className="mb-2 text-lg font-semibold group-hover:text-blue-600">
									{event.fields.title}
								</h3>
								{event.fields.description && (
									<p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
										{event.fields.description}
									</p>
								)}
								{(event.fields as any).startsAt && (
									<p className="text-sm font-medium">
										{new Date(
											(event.fields as any).startsAt,
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
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
