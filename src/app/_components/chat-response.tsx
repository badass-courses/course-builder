'use client'

import ReactMarkdown from "react-markdown";
import * as React from "react";
import usePartySocket from "partysocket/react";
import {env} from "@/env.mjs";
import {STREAM_COMPLETE} from "@/lib/streaming-chunk-publisher";
import {useRef} from "react";

export function ChatResponse(props: {requestIds:string[]}) {
  const [messages, setMessages] = React.useState<{ requestId: string, body: string }[]>([])
  const div = useRef<any>(null);
  usePartySocket({
    room: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    host: env.NEXT_PUBLIC_PARTY_KIT_URL,
    onMessage: (messageEvent) => {
      const messageData = JSON.parse(messageEvent.data)

      if(messageData.body !== STREAM_COMPLETE &&  props.requestIds.includes(messageData.requestId)) {
        setMessages((messages) => [...messages, {body: messageData.body, requestId: messageData.requestId}])
      }

      if(div.current) {
        div.current.scrollTop = div.current.scrollHeight;
      }
    }
  });

  // Group messages by requestId
  const groupedMessages = messages.reduce((groups, message) => {
    if (!groups[message.requestId]) {
      groups[message.requestId] = []
    }

    groups[message.requestId]?.push(message.body)
    return groups;
  }, {} as Record<string, string[]>)


  return (
    <div ref={div} className="max-h-400 w-full max-w-md rounded-md border overflow-auto rounded-md border bg-muted">
      {Object.entries(groupedMessages).map(([requestId, bodies], index) => (
        <div key={requestId} className="mb-4 bg-blue-100 rounded-md p-4 shadow">
          <h2 className="font-bold text-blue-700 mb-2">Stream {index + 1} ({requestId})</h2>
          <div className="prose prose-blue text-sm max-w-none"><ReactMarkdown>{bodies.join('')}</ReactMarkdown></div>
        </div>
      ))}
    </div>
  )
}