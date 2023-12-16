'use client'

import ReactMarkdown from 'react-markdown'
import * as React from 'react'
import {STREAM_COMPLETE} from '@/lib/streaming-chunk-publisher'
import {useRef} from 'react'
import {api} from '@/trpc/react'
import {useSocket} from '@/hooks/use-socket'
import {Tip} from '@/lib/tips'
import {Button, ScrollArea, Textarea} from '@coursebuilder/ui'
import {LoaderIcon, SparkleIcon} from 'lucide-react'
import {EnterIcon} from '@sanity/icons'

export function TipAssistant({tip}: {tip: Tip}) {
  const {mutateAsync: generateTitle, status: generateTitleStatus} =
    api.tips.generateTitle.useMutation()

  return (
    <div className="flex h-full w-full flex-col justify-start">
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Assistant</h3>
      <ChatResponse requestIds={[tip.videoResourceId]} />
      <div className="flex w-full flex-col items-start border-t">
        <div className="relative w-full">
          <Textarea
            className="w-full rounded-none border-0 border-b px-5 py-4 pr-10"
            placeholder="Type a message..."
            disabled={generateTitleStatus === 'loading'}
            rows={4}
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                // TODO: send message
              }
            }}
          />
          <Button
            type="button"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center p-0"
            variant="outline"
            onClick={() => {
              // TODO: send message
            }}
          >
            <EnterIcon className="w-4" />
          </Button>
        </div>
        <div className="p-5">
          <h3 className="flex pb-3 text-lg font-bold">Actions</h3>
          <Button
            type="button"
            disabled={generateTitleStatus === 'loading'}
            variant="secondary"
            onClick={async (event) => {
              event.preventDefault()
              await generateTitle({tipId: tip._id})
            }}
          >
            <SparkleIcon className="-ml-1 mr-1 w-3" /> suggest title{' '}
            {generateTitleStatus === 'loading' && (
              <LoaderIcon className="w-3 animate-spin" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ChatResponse({requestIds = []}: {requestIds: string[]}) {
  const [messages, setMessages] = React.useState<
    {requestId: string; body: string}[]
  >([])
  const div = useRef<any>(null)

  const utils = api.useUtils()

  useSocket({
    onMessage: (messageEvent) => {
      try {
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
      } catch (error) {
        // noting to do
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
    <ScrollArea viewportRef={div} className="h-[50vh] w-full scroll-smooth">
      {Object.entries(groupedMessages).map(([requestId, bodies], index) => (
        <div key={requestId} className="prose prose-sm max-w-none p-5">
          <ReactMarkdown>{bodies.join('')}</ReactMarkdown>
        </div>
      ))}
    </ScrollArea>
  )
}
