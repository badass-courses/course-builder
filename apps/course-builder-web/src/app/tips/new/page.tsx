import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {CreateTip} from '@/app/tips/_components/create-tip'
import * as React from 'react'
import {redirect} from 'next/navigation'

export default async function NewTipPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (!ability.can('upload', 'Media')) {
    redirect('/tips')
  }

  return (
    <div className="flex flex-col">
      <CreateTip />
    </div>
  )
}
