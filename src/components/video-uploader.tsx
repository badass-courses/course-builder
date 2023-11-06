'use client'

import * as React from 'react'
import {Button} from "@/components/ui/button";
import {api} from "@/trpc/react";
import usePartySocket from "partysocket/react";
import {env} from "@/env.mjs";
import {ChatResponse} from "@/app/_components/chat-response";
import MuxPlayer from "@mux/mux-player-react";
import ReactMarkdown from "react-markdown";
import {UploadDropzone} from "@/utils/uploadthing";
import {getUniqueFilename} from "@/lib/get-unique-filename";

const VideoUploader = ({moduleSlug} : {moduleSlug?: string}) => {

  const {data: sanityModule} = api.module.getBySlug.useQuery({
    slug: moduleSlug
  })

  const utils = api.useUtils()

  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
    <div className="flex flex-col space-y-4">
      <UploadDropzone
        endpoint="videoUploader"
        config={{
          mode: 'auto',
        }}
        input={{
          moduleSlug
        }}
        onBeforeUploadBegin={(files) => {
          return files.map((file) => new File([file], getUniqueFilename(file.name), {type: file.type}))
        }}
        onClientUploadComplete={async (response: any) => {
          // Do something with the response.
          await utils.module.getBySlug.invalidate({slug: moduleSlug})
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`);
        }}
      />
      <div className="flex flex-col space-y-4">
        {sanityModule?.videoResources?.map(({title, muxPlaybackId, state}: {title: string, muxPlaybackId: string, state:string}) => (
          <UploadedVideo key={title} requestId={title} playbackId={muxPlaybackId} moduleSlug={moduleSlug} state={state} />
        )).reverse()}
      </div>
    </div>

    <ChatResponse requestIds={sanityModule?.videoResources?.map(({title}: {title: string}) => title)} />
    </div>
  )
}

function UploadedVideo({requestId, playbackId, moduleSlug, state='new'}: {requestId: string, playbackId: string, state:string, moduleSlug?: string}) {
  const [generatedDraft, setGeneratedDraft] = React.useState<{title:string, content: string} | null>(null)
  const [transcriptReady, setTranscriptReady] = React.useState<boolean>(false)
  const {mutate: generatePost} = api.post.generate.useMutation()
  const {data: sanityModule} = api.module.getBySlug.useQuery({
    slug: moduleSlug
  })
  const utils = api.useUtils()

  usePartySocket({
    room: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    host: env.NEXT_PUBLIC_PARTY_KIT_URL,
    onMessage: async (messageEvent) => {
      const data = JSON.parse(messageEvent.data)

      console.log('data', data)
      console.log('requestId', requestId)
      if(data.name === 'video.asset.ready' && requestId === data.requestId) {
        await utils.module.getBySlug.invalidate({slug: moduleSlug})
      }
      if(data.name === 'transcript.ready' && requestId === data.requestId) {
        setTranscriptReady(true)
        await utils.module.getBySlug.invalidate({slug: moduleSlug})
      }
      if(data.name === 'ai.draft.completed' && requestId === data.requestId) {
        console.log('generated draft', data.body)
        setGeneratedDraft(data.body)
      }
    }
  });

  return (
    <div>
      {requestId}
      {playbackId && state === 'ready' && (
        <MuxPlayer playbackId={playbackId} />
      )}
      {sanityModule.videoResources.filter((resource: any) => resource._id === requestId)?.[0].transcript && (
        <Button onClick={() => {
          generatePost({requestId: requestId})
        } }>Generate Post Text</Button>
      )}
      {generatedDraft && (
        <div>
          <h2 className="text-2xl font-semibold">{generatedDraft.title}</h2>
          <ReactMarkdown>{generatedDraft.content}</ReactMarkdown>
          <Button onClick={() => {
            setGeneratedDraft(null)
            console.log('todo stuff')
          } }>Generate Post</Button>
        </div>
      )}
    </div>
  )
}

export default VideoUploader
