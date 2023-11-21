'use client'

import MuxPlayer, {MuxPlayerProps} from '@mux/mux-player-react'
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

  const playerProps = {
    id: 'mux-player',
    defaultHiddenCaptions: true,
    streamType: 'on-demand',
    thumbnailTime: 0,
    playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2],
    maxResolution: '2160p',
    minResolution: '540p',
  } as MuxPlayerProps

  const playbackId =
    muxPlaybackId ||
    (videoResource?.state === 'ready'
      ? videoResource?.muxPlaybackId
      : undefined)

  return (
    <div className="relative z-10 flex items-center justify-center">
      <div className="flex w-full max-w-screen-xl flex-col">
        <div className="flex items-center justify-center  overflow-hidden xl:rounded-b-md">
          <MuxPlayer playbackId={playbackId} {...playerProps} />
        </div>
      </div>
    </div>
  )
}
