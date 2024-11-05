import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getEvent } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

import { EditEventForm } from './_components/edit-event-form'

export const dynamic = 'force-dynamic'

export default async function EventEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const { ability } = await getServerAuthSession()
	const event = await getEvent(params.slug)

	if (!event || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditEventForm key={event.fields.slug} event={event} />
}
