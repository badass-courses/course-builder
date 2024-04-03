import { redirect } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export default async function ProfilePage() {
	const { session, ability } = await getServerAuthSession()

	if (ability.can('read', 'User', session?.user?.id)) {
		return <div>Profile</div>
	}

	redirect('/')
}
