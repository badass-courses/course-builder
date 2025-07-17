'use client'

import { useRouter } from 'next/navigation'
import {
	createEventSeriesWithAppLogic,
	createEventWithAppLogic,
} from '@/lib/events-query'
import { api } from '@/trpc/react'
import { z } from 'zod'

import {
	type EventCreationResult,
	type EventSeriesData,
	type SingleEventData,
} from '@coursebuilder/core'
import { CreateEventForm } from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * App-specific wrapper for the CreateEventForm component
 * Handles Next.js routing, tRPC queries, and adds system fields
 */
export default function CreateEventFormWrapper() {
	const router = useRouter()
	const { data: tags } = api.tags.getTags.useQuery()
	const parsedTags = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags || [])
	const handleSuccess = async (result: EventCreationResult) => {
		if (result.type === 'single' && result.event) {
			router.push(getResourcePath('event', result.event.fields?.slug, 'edit'))
		} else if (result.type === 'series' && result.eventSeries) {
			router.push(
				getResourcePath('event', result.eventSeries.fields?.slug, 'edit'),
			)
		}
	}

	const createEvent = async (
		formData: Omit<SingleEventData, 'createdById' | 'organizationId'>,
	) => {
		return await createEventWithAppLogic(formData)
	}

	const createEventSeries = async (
		formData: Omit<EventSeriesData, 'createdById' | 'organizationId'>,
	) => {
		return await createEventSeriesWithAppLogic(formData)
	}

	return (
		<CreateEventForm
			tags={parsedTags}
			onSuccess={handleSuccess}
			createEvent={createEvent}
			createEventSeries={createEventSeries}
			allowMultipleEvents={true}
			allowCoupons={true}
			defaultTimezone="America/Los_Angeles"
			defaultPrice={250}
			defaultQuantity={40}
		/>
	)
}
