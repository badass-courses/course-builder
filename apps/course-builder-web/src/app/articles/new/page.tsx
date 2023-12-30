import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import * as React from 'react'
import {CreateArticle} from '../_components/create-article'

export default async function NewTipPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? <CreateArticle /> : null}
    </div>
  )
}
