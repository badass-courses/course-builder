'use client'

import * as React from 'react'
import { useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { STREAM_COMPLETE } from '@/lib/streaming-chunk-publisher'
import { Tip } from '@/lib/tips'
import { api } from '@/trpc/react'
import { EnterIcon } from '@sanity/icons'
import { LoaderIcon, SparkleIcon } from 'lucide-react'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'
import ReactMarkdown from 'react-markdown'

import { Button, ScrollArea, Textarea } from '@coursebuilder/ui'

export function TipAssistant({ tip }: { tip: Tip }) {
  const { mutate: sendTipChatMessage } = api.tips.chat.useMutation()
  const [messages, setMessages] = React.useState<ChatCompletionRequestMessage[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useSocket({
    room: tip._id,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (messageData.name === 'resource.chat.completed' && messageData.requestId === tip._id) {
          setMessages(messageData.body)
        }
      } catch (error) {
        // noting to do
      }
    },
  })

  // TODO: If we want to do like a distributed chat, the challenge is going to be to divide each individual request up,
  //  so the response that we' we're getting is the response to a single request and not based on the current screen
  //  we're in. So you have a user, tip in a request, and that's coming in. And th how can we maybe think about it from
  //  a tree-like perspective? to where when you make a request, you can then edit it and the responses to that request
  //  go kind of, you can prune basically and come back to it and do that sort of thing. And then also allow people to
  //  have multiple conversations at once and kind of see the output of other people's conversations and maybe even use
  //  them contextually.

  return (
    <div className="flex h-full w-full flex-col justify-start">
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Assistant</h3>
      <TipChatResponse requestId={tip._id} />
      <div className="flex w-full flex-col items-start border-t">
        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            className="w-full rounded-none border-0 border-b px-5 py-4 pr-10"
            placeholder="Type a message..."
            rows={4}
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendTipChatMessage({
                  tipId: tip._id,
                  messages: [
                    ...messages,
                    {
                      role: ChatCompletionRequestMessageRoleEnum.User,
                      content: event.currentTarget.value,
                    },
                  ],
                })
                event.currentTarget.value = ''
              }
            }}
          />
          <Button
            type="button"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center p-0"
            variant="outline"
            onClick={async (event) => {
              event.preventDefault()
              if (textareaRef.current) {
                sendTipChatMessage({
                  tipId: tip._id,
                  messages: [
                    ...messages,
                    {
                      role: ChatCompletionRequestMessageRoleEnum.User,
                      content: textareaRef.current?.value,
                    },
                  ],
                })
                textareaRef.current.value = ''
              }
            }}
          >
            <EnterIcon className="w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TipChatResponse({ requestId }: { requestId: string }) {
  const [messages, setMessages] = React.useState<{ requestId: string; body: string }[]>([])
  const div = useRef<any>(null)

  const utils = api.useUtils()

  useSocket({
    room: requestId,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (
          messageData.body !== STREAM_COMPLETE &&
          messageData.name == 'ai.message' &&
          requestId === messageData.requestId
        ) {
          setMessages((messages) => [...messages, { body: messageData.body, requestId: messageData.requestId }])
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
