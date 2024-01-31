import * as React from 'react'
import { notFound } from 'next/navigation'
import { CreateTip } from '@/app/tips/_components/create-tip'
import { getAbility } from '@/lib/ability'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function NewTipPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <CreateTip />
    </div>
  )
}
