import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {getTip} from '@/lib/tips'
import {EditTipForm} from '../../_components/edit-tip-form'
import {redirect} from 'next/navigation'

export default async function TipEditPage({params}: {params: {slug: string}}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tip = await getTip(params.slug)

  if (!tip || !ability.can('upload', 'Media')) {
    redirect('/tips')
  }

  return (
    <div className="relative mx-auto h-full w-full flex-grow items-center justify-center border-b">
      <EditTipForm key={tip.slug} tip={tip} />
    </div>
  )
}
