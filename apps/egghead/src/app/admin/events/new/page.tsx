import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export const metadata: Metadata = {
	title: 'Create Event',
	description: 'Create a new event or workshop',
}

/**
 * @description Create new event page in admin
 */
export default async function AdminNewEventPage() {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('create', 'Content')) {
		redirect('/login')
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold">Create New Event</h1>
					<p className="text-muted-foreground">
						Create a workshop, webinar, or live event
					</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<div className="py-12 text-center">
						<h2 className="mb-2 text-xl font-semibold">Event Creation Form</h2>
						<p className="text-muted-foreground">
							Event creation form will be implemented in Phase 2
						</p>
						<p className="mt-4 text-sm text-gray-500">
							For now, events can be created via the CourseBuilder adapter
							directly.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
