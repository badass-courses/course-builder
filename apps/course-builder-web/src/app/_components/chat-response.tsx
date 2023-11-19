'use client'

import ReactMarkdown from 'react-markdown'
import * as React from 'react'
import {STREAM_COMPLETE} from '@/lib/streaming-chunk-publisher'
import {useRef} from 'react'
import {api} from '@/trpc/react'
import {useSocket} from '@/hooks/use-socket'

export function ChatResponse({requestIds = []}: {requestIds: string[]}) {
  const [messages, setMessages] = React.useState<
    {requestId: string; body: string}[]
  >([])
  const div = useRef<any>(null)

  const utils = api.useUtils()

  useSocket({
    onMessage: (messageEvent) => {
      const messageData = JSON.parse(messageEvent.data)

      console.log({requestIds, messageData})

      if (
        messageData.body !== STREAM_COMPLETE &&
        requestIds.includes(messageData.requestId)
      ) {
        setMessages((messages) => [
          ...messages,
          {body: messageData.body, requestId: messageData.requestId},
        ])
      }

      utils.module.invalidate()

      if (div.current) {
        div.current.scrollTop = div.current.scrollHeight
      }
    },
  })
  // Group messages by requestId
  const groupedMessages = messages.reduce(
    (groups, message) => {
      if (!groups[message.requestId]) {
        groups[message.requestId] = []
      }

      groups[message.requestId]?.push(message.body)
      return groups
    },
    {} as Record<string, string[]>,
  )

  return (
    <div
      ref={div}
      className="max-h-400 w-full max-w-md overflow-auto rounded-md rounded-md border border bg-muted"
    >
      {Object.entries(groupedMessages).map(([requestId, bodies], index) => (
        <div key={requestId} className="mb-4 rounded-md bg-blue-100 p-4 shadow">
          <h2 className="mb-2 font-bold text-blue-700">
            Stream {index + 1} ({requestId})
          </h2>
          <div className="prose prose-blue max-w-none text-sm">
            <ReactMarkdown>{bodies.join('')}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}
