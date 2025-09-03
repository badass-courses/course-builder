import { redirect } from 'next/navigation'
import { createEvent, createEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

import { CreateEventForm } from '@coursebuilder/ui/event-creation/create-event-form'
import type {
	EventFormData,
	EventSeriesFormData,
} from '@coursebuilder/ui/event-creation/create-event-form'

export default async function NewEventPage() {
	const { session, ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		redirect('/')
	}

	async function handleCreateEvent(data: EventFormData) {
		'use server'
		const event = await createEvent(data)
		return event
	}

	async function handleCreateEventSeries(data: EventSeriesFormData) {
		'use server'
		const result = await createEventSeries(data)
		return result
	}

	async function handleSuccess(result: any) {
		'use server'
		redirect('/admin/events')
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<h1 className="mb-8 text-3xl font-bold">Create New Event</h1>
			<CreateEventForm
				createEvent={handleCreateEvent}
				createEventSeries={handleCreateEventSeries}
				onSuccess={handleSuccess}
				defaultPrice={0}
				defaultQuantity={100}
				allowMultipleEvents={true}
				allowCoupons={false}
			/>
		</div>
	)
}
