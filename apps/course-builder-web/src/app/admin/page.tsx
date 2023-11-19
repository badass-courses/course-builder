import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {redirect} from 'next/navigation'

export default async function AdminPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (ability.can('view', 'Anything')) {
    return <div>Admin</div>
  }

  redirect('/')
}
