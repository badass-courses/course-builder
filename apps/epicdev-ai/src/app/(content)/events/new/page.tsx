import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getServerAuthSession } from '@/server/auth'

import CreateNewEventForm from '../_components/create-new-event-form'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<LayoutClient withContainer>
			<main className="max-w-(--breakpoint-sm) mx-auto flex w-full flex-col pb-16 pt-4">
				<h1 className="mb-4 text-2xl font-bold">Create New Event</h1>
				<CreateNewEventForm />
			</main>
		</LayoutClient>
	)
}
