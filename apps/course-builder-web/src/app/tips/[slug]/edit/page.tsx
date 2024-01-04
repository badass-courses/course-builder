import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {getTip} from '@/lib/tips'
import {EditTipForm} from '../../_components/edit-tip-form'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TipEditPage({params}: {params: {slug: string}}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tip = await getTip(params.slug)

  if (!tip || !ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <div className="relative mx-auto flex h-full w-full flex-grow flex-col items-center justify-center">
      <EditTipForm key={tip.slug} tip={tip} />
    </div>
  )
}
