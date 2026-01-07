import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter } from '@/db'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

import { EditEventForm } from './_components/edit-event-form'
import { EditEventSeriesForm } from './_components/edit-event-series-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	const event = await getEventOrEventSeries(params.slug)

	return {
		title: `Edit: ${event?.fields.title}`,
		description: event?.fields.description,
	}
}

export default async function EventEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const { ability } = await getServerAuthSession()
	if (!ability.can('create', 'Content')) {
		notFound()
	}

	const event = await getEventOrEventSeries(params.slug)

	if (!event) {
		notFound()
	}

	// Extract video resource from post resources
	const videoResourceRef =
		event.resources
			?.map((resource) => resource.resource)
			?.find((resource) => {
				return resource.type === 'videoResource'
			}) || null

	// Resolve video resource server-side instead of passing a loader
	let videoResource = null
	if (videoResourceRef) {
		try {
			videoResource = await courseBuilderAdapter.getVideoResource(
				videoResourceRef.id,
			)
		} catch (error) {
			console.error('Error loading video resource:', error)
		}
	}

	return (
		<LayoutClient>
			{event.type === 'event' && (
				<EditEventForm
					key={event.fields.slug}
					event={event}
					videoResource={videoResource}
				/>
			)}
			{event.type === 'event-series' && (
				<EditEventSeriesForm
					key={event.fields.slug}
					event={event}
					videoResource={videoResource}
				/>
			)}
		</LayoutClient>
	)
}
