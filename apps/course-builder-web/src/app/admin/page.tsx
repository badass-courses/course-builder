import { notFound } from 'next/navigation'
import { getAbility } from '@/lib/ability'
import { getServerAuthSession } from '@/server/auth'

export default async function AdminPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (ability.can('manage', 'all')) {
    return <div>Admin</div>
  } else {
    notFound()
  }
}
