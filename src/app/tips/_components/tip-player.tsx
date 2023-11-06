"use client"

import MuxPlayer from "@mux/mux-player-react"
import * as React from "react"
import {api} from "@/trpc/react";

export function TipPlayer({videoResourceId}: {
  videoResourceId: string
}) {
  const {data: videoResource} = api.videoResources.getById.useQuery({
    videoResourceId
  })
  const videoAvailable = videoResource?.muxPlaybackId && videoResource?.state === 'ready'
  return (
    <div className="max-w-2xl">{videoAvailable ? <MuxPlayer playbackId={videoResource.muxPlaybackId}/> : null}</div>
  )
}