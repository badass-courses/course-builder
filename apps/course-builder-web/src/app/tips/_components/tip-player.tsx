'use client'

import * as React from 'react'
import { api } from '@/trpc/react'
import { type MuxPlayerProps } from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'

import { cn } from '@coursebuilder/ui/utils/cn'

export function TipPlayer({
  videoResourceId,
  muxPlaybackId,
  className,
}: {
  videoResourceId: string
  muxPlaybackId?: string
  className?: string
}) {
  const { data: videoResource } = api.videoResources.getById.useQuery({
    videoResourceId,
  })

  const playerProps = {
    id: 'mux-player',
    defaultHiddenCaptions: true,
    streamType: 'on-demand',
    thumbnailTime: 0,
    playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
    maxResolution: '2160p',
    minResolution: '540p',
  } as MuxPlayerProps

  const playbackId = muxPlaybackId || (videoResource?.state === 'ready' ? videoResource?.muxPlaybackId : undefined)

  return <MuxPlayer playbackId={playbackId} className={cn(className)} {...playerProps} />
}
