import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {getTip} from '@/lib/tips'
import {EditTipForm} from '../../_components/edit-tip-form'

export default async function TipEditPage({params}: {params: {slug: string}}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tip = await getTip(params.slug)

  return tip && ability.can('upload', 'Media') ? (
    <div className="relative mx-auto h-full w-full flex-grow items-center justify-center border-b">
      <EditTipForm key={tip.slug} tip={tip} />
      {/* <SuggestionResults videoResourceId={tip.videoResourceId} /> */}
    </div>
  ) : null
}
