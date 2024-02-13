import * as React from 'react'
import { notFound } from 'next/navigation'
import { getAbility } from '@/lib/ability'
import { getTip } from '@/lib/tips'
import { VideoResource } from '@/lib/video-resource'
import { getServerAuthSession } from '@/server/auth'
import { sanityQuery } from '@/server/sanity.server'

import { EditTipForm } from '../../_components/edit-tip-form'

export const dynamic = 'force-dynamic'

export default async function TipEditPage({ params }: { params: { slug: string } }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tip = await getTip(params.slug)

  if (!tip || !ability.can('create', 'Content')) {
    notFound()
  }

  const videoResourceLoader = sanityQuery<VideoResource>(
    `*[_type == "videoResource" && _id == "${tip.videoResourceId}"][0]`,
    { tags: ['tips', tip._id] },
  )

  return (
    <div className="relative mx-auto flex h-full w-full flex-grow flex-col items-center justify-center">
      <EditTipForm key={tip.slug} tip={tip} videoResourceLoader={videoResourceLoader} />
    </div>
  )
}
