import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import * as React from 'react'

export default async function NewTutorialPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? <div>New Tutorial Form</div> : null}
    </div>
  )
}
