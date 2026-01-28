import { notFound } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getServerAuthSession } from '@/server/auth'

import CreateNewEventDialog from '../_components/create-new-event-dialog'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<LayoutClient withContainer>
			<main className="max-w-(--breakpoint-sm) min-h-fullscreen mx-auto flex w-full flex-col items-center justify-center pb-16 pt-4">
				<CreateNewEventDialog isOpen={true} />
			</main>
		</LayoutClient>
	)
}
