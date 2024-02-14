'use client'

import * as React from 'react'
import { ChatResponse } from '@/app/_components/chat-response'
import { useSocket } from '@/hooks/use-socket'
import { getUniqueFilename } from '@/lib/get-unique-filename'
import { api } from '@/trpc/react'
import { UploadDropzone } from '@/utils/uploadthing'
import MuxPlayer from '@mux/mux-player-react'

const VideoUploader = ({ moduleSlug }: { moduleSlug?: string }) => {
  const [requestIds, setRequestIds] = React.useState<string[]>([])

  const { data: sanityModule } = api.module.getBySlug.useQuery({
    slug: moduleSlug,
  })

  const utils = api.useUtils()

  useSocket({
    onMessage: async (messageEvent) => {
      const data = JSON.parse(messageEvent.data)
      const invalidateOn = ['videoResource.created', 'video.asset.ready', 'transcript.ready']

      if (invalidateOn.includes(data.name)) {
        await utils.module.getBySlug.invalidate({ slug: moduleSlug })
      }
    },
  })

  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
      <div className="flex flex-col space-y-4">
        <UploadDropzone
          endpoint="videoUploader"
          config={{
            mode: 'auto',
          }}
          input={{
            moduleSlug,
          }}
          onBeforeUploadBegin={(files) => {
            return files.map(
              (file) =>
                new File([file], getUniqueFilename(file.name), {
                  type: file.type,
                }),
            )
          }}
          onClientUploadComplete={async (response: any) => {
            setRequestIds(response.map((res: any) => res.fileName))
            await utils.module.getBySlug.invalidate({ slug: moduleSlug })
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            alert(`ERROR! ${error.message}`)
          }}
        />
        <div className="flex flex-col space-y-4">
          {sanityModule?.videoResources
            ?.map(({ title, muxPlaybackId, state }: { title: string; muxPlaybackId: string; state: string }) => (
              <UploadedVideo
                key={title}
                requestId={title}
                playbackId={muxPlaybackId}
                moduleSlug={moduleSlug}
                state={state}
              />
            ))
            .reverse()}
        </div>
      </div>

      <ChatResponse requestIds={requestIds} />
    </div>
  )
}

function UploadedVideo({
  requestId,
  playbackId,
  state = 'new',
}: {
  requestId: string
  playbackId: string
  state: string
  moduleSlug?: string
}) {
  return (
    <div>
      {requestId}
      {playbackId && state === 'ready' && <MuxPlayer playbackId={playbackId} />}
    </div>
  )
}

export default VideoUploader
