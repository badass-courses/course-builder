import * as React from 'react'
import { notFound } from 'next/navigation'
import { getAbility } from '@/lib/ability'
import { getTip } from '@/lib/tips'
import { getVideoResource } from '@/lib/video-resource'
import { getServerAuthSession } from '@/server/auth'

import { EditTipForm } from '../../_components/edit-tip-form'

export const dynamic = 'force-dynamic'

export default async function TipEditPage({ params }: { params: { slug: string } }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tip = await getTip(params.slug)

  if (!tip || !ability.can('create', 'Content')) {
    notFound()
  }

  const videoResourceLoader = getVideoResource(tip.videoResourceId)

  return <EditTipForm key={tip.slug} tip={tip} videoResourceLoader={videoResourceLoader} />
}
