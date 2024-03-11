import * as React from 'react'
import { notFound } from 'next/navigation'
import { getAbility } from '@/ability'
import { getServerAuthSession } from '@/server/auth'

import { CreatePrompt } from '../_components/create-prompt'

export const dynamic = 'force-dynamic'

export default async function NewTipPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <CreatePrompt />
    </div>
  )
}
