import { notFound, redirect } from 'next/navigation'
import { getEventOrEventSeries } from '@/lib/events-query'
import { getServerAuthSession } from '@/server/auth'

interface EditEventPageProps {
	params: { slug: string }
}

/**
 * @description Edit event page - redirects to admin for now
 */
export default async function EditEventPage({ params }: EditEventPageProps) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('update', 'Content')) {
		redirect('/login')
	}

	const event = await getEventOrEventSeries(params.slug)

	if (!event) {
		notFound()
	}

	// For now, redirect to admin - we'll add the form here later
	redirect(`/admin/events/${event.fields.slug}/edit`)
}
