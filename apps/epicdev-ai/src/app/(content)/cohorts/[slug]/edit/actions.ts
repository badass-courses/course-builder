'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { OfficeHourEvent } from '@/lib/cohort'
import {
	createOfficeHourEvents,
	deleteOfficeHourEvent,
	enableCohortOfficeHours,
	updateOfficeHourEvent,
} from '@/lib/cohorts-query'

import { ContentResource } from '@coursebuilder/core/schemas'

export const onCohortSave = async (resource: ContentResource) => {
	'use server'
	revalidatePath(`/cohorts/${resource.fields?.slug}`)
	redirect(`/cohorts/${resource.fields?.slug}`)
}

export async function createOfficeHourEventsAction(
	cohortId: string,
	events: OfficeHourEvent[],
) {
	'use server'
	try {
		const createdEventIds = await createOfficeHourEvents(cohortId, events)
		// Enable office hours in the cohort if not already enabled
		await enableCohortOfficeHours(cohortId)
		revalidatePath(`/cohorts/[slug]/edit`, 'page')
		return { success: true, eventIds: createdEventIds }
	} catch (error) {
		console.error('Server action error:', error)
		return { success: false, error: error.message }
	}
}

export async function updateOfficeHourEventAction(
	eventId: string,
	updates: Partial<OfficeHourEvent>,
) {
	'use server'
	try {
		await updateOfficeHourEvent(eventId, updates)
		revalidatePath(`/cohorts/[slug]/edit`, 'page')
		return { success: true }
	} catch (error) {
		console.error('Server action error:', error)
		return { success: false, error: error.message }
	}
}

export async function deleteOfficeHourEventAction(
	cohortId: string,
	eventId: string,
) {
	'use server'
	try {
		await deleteOfficeHourEvent(cohortId, eventId)
		revalidatePath(`/cohorts/[slug]/edit`, 'page')
		return { success: true }
	} catch (error) {
		console.error('Server action error:', error)
		return { success: false, error: error.message }
	}
}
