import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { EventSchema } from '@/lib/events'
import { getServerAuthSession } from '@/server/auth'

import { EditEventForm } from './_components/edit-event-form'

export const dynamic = 'force-dynamic'

export default async function EventEditPage({
	params,
}: {
	params: { slug: string }
}) {
	headers()
	const { ability } = await getServerAuthSession()
	const event = EventSchema.parse(
		await courseBuilderAdapter.getContentResource(params.slug),
	)

	console.log({ event })

	if (!event || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditEventForm key={event.fields.slug} event={event} />
}
