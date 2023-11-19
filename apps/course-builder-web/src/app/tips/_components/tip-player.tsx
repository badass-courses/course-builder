'use client'

import MuxPlayer from '@mux/mux-player-react'
import * as React from 'react'
import {api} from '@/trpc/react'

export function TipPlayer({
  videoResourceId,
  muxPlaybackId,
}: {
  videoResourceId: string
  muxPlaybackId?: string
}) {
  const {data: videoResource} = api.videoResources.getById.useQuery({
    videoResourceId,
  })
  const playbackId =
    muxPlaybackId ||
    (videoResource?.state === 'ready' && videoResource?.muxPlaybackId)
  return (
    <div className="max-w-2xl">
      {playbackId ? <MuxPlayer playbackId={playbackId} /> : null}
    </div>
  )
}
