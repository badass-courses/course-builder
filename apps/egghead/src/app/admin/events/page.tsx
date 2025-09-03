import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAllEvents } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

export const metadata: Metadata = {
	title: 'Events Management',
	description: 'Manage events and workshops',
}

/**
 * @description Admin events management page
 */
export default async function AdminEventsPage() {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('read', 'Content')) {
		redirect('/login')
	}

	const events = await getAllEvents()

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="mb-2 text-3xl font-bold">Events Management</h1>
					<p className="text-muted-foreground">
						Create and manage events and workshops
					</p>
				</div>
				{ability.can('create', 'Content') && (
					<Link
						href="/admin/events/new"
						className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						+ Create Event
					</Link>
				)}
			</div>

			{events.length === 0 ? (
				<div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
					<h2 className="mb-2 text-xl font-semibold">No events yet</h2>
					<p className="text-muted-foreground mb-4">
						Get started by creating your first event.
					</p>
					{ability.can('create', 'Content') && (
						<Link
							href="/admin/events/new"
							className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
						>
							Create Your First Event
						</Link>
					)}
				</div>
			) : (
				<div className="overflow-hidden rounded-lg bg-white shadow">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Event
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Start Date
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 bg-white">
							{events.map((event) => (
								<tr key={event.id} className="hover:bg-gray-50">
									<td className="whitespace-nowrap px-6 py-4">
										<div>
											<div className="font-medium text-gray-900">
												{event.fields.title}
											</div>
											{event.fields.description && (
												<div className="max-w-md truncate text-sm text-gray-500">
													{event.fields.description}
												</div>
											)}
										</div>
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										<span
											className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
												event.fields.state === 'published'
													? 'bg-green-100 text-green-800'
													: event.fields.state === 'draft'
														? 'bg-yellow-100 text-yellow-800'
														: 'bg-gray-100 text-gray-800'
											}`}
										>
											{event.fields.state}
										</span>
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{(event.fields as any).startsAt
											? new Date(
													(event.fields as any).startsAt,
												).toLocaleDateString()
											: 'Not set'}
									</td>
									<td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
										<Link
											href={`/events/${event.fields.slug}`}
											className="text-blue-600 hover:text-blue-900"
										>
											View
										</Link>
										{ability.can('update', 'Content') && (
											<Link
												href={`/admin/events/${event.fields.slug}/edit`}
												className="text-indigo-600 hover:text-indigo-900"
											>
												Edit
											</Link>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
