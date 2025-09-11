import { notFound, redirect } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { getCachedEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

import { EditEventForm } from './_components/edit-event-form'

interface EditEventPageProps {
	params: Promise<{
		slug: string
	}>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
	const resolvedParams = await params
	const { session, ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		redirect('/')
	}

	const event = await getCachedEventOrEventSeries(resolvedParams.slug)

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
		<div className="">
			<h1 className="mb-8 text-3xl font-bold">Edit Event</h1>
			{event.type === 'event' && (
				<EditEventForm
					key={event.fields.slug}
					event={event}
					videoResource={videoResource}
				/>
			)}
			{event.type === 'event-series' && null}
		</div>
	)
}
