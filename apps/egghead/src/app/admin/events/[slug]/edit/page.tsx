import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

interface AdminEditEventPageProps {
	params: { slug: string }
}

/**
 * @description Generate metadata for admin edit event page
 */
export async function generateMetadata({
	params,
}: AdminEditEventPageProps): Promise<Metadata> {
	const event = await getEventOrEventSeries(params.slug)

	return {
		title: event ? `Edit ${event.fields.title}` : 'Edit Event',
	}
}

/**
 * @description Admin edit event page
 */
export default async function AdminEditEventPage({
	params,
}: AdminEditEventPageProps) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('update', 'Content')) {
		redirect('/login')
	}

	const event = await getEventOrEventSeries(params.slug)

	if (!event) {
		notFound()
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold">Edit Event</h1>
					<p className="text-muted-foreground">Editing: {event.fields.title}</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<div className="py-12 text-center">
						<h2 className="mb-2 text-xl font-semibold">Event Edit Form</h2>
						<p className="text-muted-foreground">
							Event editing form will be implemented in Phase 2
						</p>
						<div className="mx-auto mt-6 max-w-md text-left">
							<h3 className="mb-2 font-semibold">Current Event Data:</h3>
							<pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
								{JSON.stringify(
									{
										id: event.id,
										type: event.type,
										title: event.fields.title,
										slug: event.fields.slug,
										description: event.fields.description,
										startsAt: (event.fields as any).startsAt,
										endsAt: (event.fields as any).endsAt,
										state: event.fields.state,
										visibility: event.fields.visibility,
									},
									null,
									2,
								)}
							</pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
