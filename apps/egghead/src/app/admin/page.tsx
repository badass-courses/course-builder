import { notFound, redirect } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export default async function AdminPage() {
	const { ability } = await getServerAuthSession()

	if (ability.can('manage', 'all')) {
		redirect('/admin/instructors')
	} else {
		notFound()
	}
}
