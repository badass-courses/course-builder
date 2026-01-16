'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { RESOURCE_UPDATED_EVENT } from '@/inngest/events/resource-management'
import { inngest } from '@/inngest/inngest.server'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onEventSave = async (resource: ContentResource) => {
	'use server'

	// Dispatch inngest event for calendar sync
	if (resource.type === 'event') {
		await inngest.send({
			name: RESOURCE_UPDATED_EVENT,
			data: {
				id: resource.id,
				type: resource.type,
			},
		})
	}

	revalidatePath(`/events/${resource.fields?.slug}`)
	redirect(`/events/${resource.fields?.slug}`)
}

/**
 * Manually trigger calendar sync for an event.
 * Useful for backfilling existing events that don't have a calendarId.
 */
export const triggerCalendarSync = async (eventId: string) => {
	'use server'

	await inngest.send({
		name: RESOURCE_UPDATED_EVENT,
		data: {
			id: eventId,
			type: 'event',
		},
	})

	return { success: true, eventId }
}
