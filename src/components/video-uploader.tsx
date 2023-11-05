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

const VideoUploader = () => {

  const [requestIds, setRequestIds] = React.useState<string[]>([])

  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
    <div className="flex flex-col space-y-4">
      <UploadDropzone
        endpoint="videoUploader"
        onBeforeUploadBegin={(files) => {
          console.log(files.map((file) => new File([file], getUniqueFilename(file.name), {type: file.type})))
          return files.map((file) => new File([file], getUniqueFilename(file.name), {type: file.type}))
        }}
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files: ", res);
          setRequestIds((requestIds) => [...requestIds, ...res?.map(file => file.name) || 'error'])
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`);
        }}
      />
      <div className="flex flex-col space-y-4">
        {requestIds.map((requestId) => (
          <UploadedVideo key={requestId} requestId={requestId} />
        ))}
      </div>
    </div>

    <ChatResponse requestIds={requestIds} />
    </div>
  )
}

function UploadedVideo({requestId}: {requestId: string}) {
  const [playbackId, setPlaybackId] = React.useState<string>()
  const [generatedDraft, setGeneratedDraft] = React.useState<{title:string, content: string} | null>(null)
  const [transcriptReady, setTranscriptReady] = React.useState<boolean>(false)

  const {mutate: generatePost} = api.post.generate.useMutation()
  const {mutate: createPost} = api.post.create.useMutation()

  usePartySocket({
    room: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    host: env.NEXT_PUBLIC_PARTY_KIT_URL,
    onMessage: (messageEvent) => {
      const data = JSON.parse(messageEvent.data)
      if(data.name === 'video.asset.ready' && requestId === data.requestId) {
        setPlaybackId(data.body)
      }
      if(data.name === 'transcript.ready' && requestId === data.requestId) {
        setTranscriptReady(true)
      }
      if(data.name === 'ai.draft.completed' && requestId === data.requestId) {
        setGeneratedDraft(data.body)
      }
    }
  });

  return (
    <div>
      {requestId}
      {playbackId && (
        <MuxPlayer playbackId={playbackId} />
      )}
      {transcriptReady && (
        <Button onClick={() => {
          setGeneratedDraft(null)
          generatePost({
            requestId
          })
        } }>Generate Post Text</Button>
      )}
      {generatedDraft && (
        <div>
          <h2 className="text-2xl font-semibold">{generatedDraft.title}</h2>
          <ReactMarkdown>{generatedDraft.content}</ReactMarkdown>
          <Button onClick={() => {
            setGeneratedDraft(null)
            createPost({
              requestId,
              title: generatedDraft.title,
              body: generatedDraft.content
            })
          } }>Generate Post</Button>
        </div>
      )}
    </div>
  )
}

export default VideoUploader
