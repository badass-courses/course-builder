import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export default async function AdminPage() {
	const { ability } = await getServerAuthSession()

	if (ability.can('manage', 'all')) {
		return <div>Admin</div>
	} else {
		notFound()
	}
}
