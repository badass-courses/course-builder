import { notFound, redirect } from 'next/navigation'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

import { EditEventForm } from '../_components/edit-event-form'

interface EditEventPageProps {
	params: {
		slug: string
	}
}

export default async function EditEventPage({ params }: EditEventPageProps) {
	const resolvedParams = await params
	const { session, ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		redirect('/')
	}

	const event = await getEventOrEventSeries(resolvedParams.slug)

	if (!event) {
		notFound()
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="mb-8 text-3xl font-bold">Edit Event</h1>
			<EditEventForm event={event} />
		</div>
	)
}
