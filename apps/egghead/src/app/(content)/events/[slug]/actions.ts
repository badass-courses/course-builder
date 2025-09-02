'use server'

import { revalidatePath } from 'next/cache'
import { updateEvent as updateEventQuery } from '@/lib/events-query'

export async function updateEvent(eventId: string, data: any) {
	try {
		const updatedEvent = await updateEventQuery(
			{
				id: eventId,
				fields: {
					title: data.title,
					description: data.description,
					body: data.body,
					startsAt: data.startsAt?.toISOString(),
					endsAt: data.endsAt?.toISOString(),
					timezone: data.timezone,
					attendeeInstructions: data.attendeeInstructions,
					price: data.price,
					quantity: data.quantity,
					state: data.state,
					visibility: data.visibility,
				},
			},
			'save',
		)

		if (updatedEvent) {
			revalidatePath('/events')
			revalidatePath(`/events/${updatedEvent.fields.slug}`)
			return { success: true, event: updatedEvent }
		}

		return { success: false, error: 'Failed to update event' }
	} catch (error) {
		console.error('Error updating event:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'An error occurred',
		}
	}
}
