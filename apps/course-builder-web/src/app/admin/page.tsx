import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {notFound} from 'next/navigation'

export default async function AdminPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (ability.can('manage', 'all')) {
    return <div>Admin</div>
  } else {
    notFound()
  }
}
