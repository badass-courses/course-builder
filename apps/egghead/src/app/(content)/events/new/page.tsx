import { redirect } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

/**
 * @description Create new event page - redirects to admin for now
 */
export default async function NewEventPage() {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user || !ability.can('create', 'Content')) {
		redirect('/login')
	}

	// For now, redirect to admin - we'll add the form here later
	redirect('/admin/events/new')
}
