import { redirect } from 'next/navigation'
import { getAbility } from '@/ability'
import { getServerAuthSession } from '@/server/auth'

export default async function ProfilePage() {
	const session = await getServerAuthSession()
	const ability = getAbility({ user: session?.user })

	if (ability.can('read', 'User', session?.user?.id)) {
		return <div>Profile</div>
	}

	redirect('/')
}
