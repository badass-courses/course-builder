'use client'

import ReactMarkdown from 'react-markdown'
import * as React from 'react'
import {STREAM_COMPLETE} from '@/lib/streaming-chunk-publisher'
import {useRef} from 'react'
import {api} from '@/trpc/react'
import {useSocket} from '@/hooks/use-socket'
import {Button, ScrollArea, Textarea} from '@coursebuilder/ui'
import {EnterIcon} from '@sanity/icons'
import {
  type ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from 'openai-edge'

export function ArticleAssistant({
  article,
}: {
  article: {body: string | null; title: string; _id: string}
}) {
  const {mutate: sendArticleChatMessage} = api.articles.chat.useMutation()
  const [messages, setMessages] = React.useState<
    ChatCompletionRequestMessage[]
  >([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useSocket({
    room: article._id,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (
          messageData.name === 'article.chat.completed' &&
          messageData.requestId === article._id
        ) {
          setMessages(messageData.body)
        }
      } catch (error) {
        // noting to do
      }
    },
  })

  return (
    <div className="flex h-full w-full flex-col justify-start">
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Assistant</h3>
      <ArticleChatResponse requestId={article._id} />
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
                sendArticleChatMessage({
                  articleId: article._id,
                  messages: [
                    ...messages,
                    {
                      role: ChatCompletionRequestMessageRoleEnum.User,
                      content: `${event.currentTarget.value}
                      
                      current title: ${article.title}
                      current body: ${article.body}
                      `,
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
                sendArticleChatMessage({
                  articleId: article._id,
                  messages: [
                    ...messages,
                    {
                      role: ChatCompletionRequestMessageRoleEnum.User,
                      content: `${event.currentTarget.value}
                      
                      current title: ${article.title}
                      current body: ${article.body}
                      `,
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

        <div className="p-5">
          <h3 className="flex pb-3 text-lg font-bold">Actions</h3>
        </div>
      </div>
    </div>
  )
}

function ArticleChatResponse({requestId}: {requestId: string}) {
  const [messages, setMessages] = React.useState<
    {requestId: string; body: string}[]
  >([])
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
