import * as React from 'react'
import { notFound } from 'next/navigation'
import { reprocessTranscript } from '@/app/tips/[slug]/edit/actions'
import { getAbility } from '@/lib/ability'
import { getTip } from '@/lib/tips'
import { getVideoResource } from '@/lib/video-resource'
import { getServerAuthSession } from '@/server/auth'

import { Button } from '@coursebuilder/ui'

import { EditTipForm } from '../../_components/edit-tip-form'

export const dynamic = 'force-dynamic'

export default async function TipEditPage({ params }: { params: { slug: string } }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tip = await getTip(params.slug)

  if (!tip || !ability.can('create', 'Content')) {
    notFound()
  }

  const videoResourceLoader = getVideoResource(
    tip.videoResourceId,
    tip.videoResourceId ? [tip.videoResourceId, 'tips', tip._id] : ['tips', tip._id],
  )

  return (
    <div className="relative mx-auto flex h-full w-full flex-grow flex-col items-center justify-center">
      <EditTipForm key={tip.slug} tip={tip} videoResourceLoader={videoResourceLoader} />
    </div>
  )
}
