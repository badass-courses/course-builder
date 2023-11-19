import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {redirect} from 'next/navigation'

export default async function ProfilePage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (ability.can('view', 'Profile', session?.user?.id)) {
    return <div>Profile</div>
  }

  redirect('/')
}
