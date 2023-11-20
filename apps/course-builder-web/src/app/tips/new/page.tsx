import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {CreateTip} from '@/app/tips/_components/create-tip'
import * as React from 'react'

export default async function NewTipPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? <CreateTip /> : null}
    </div>
  )
}
