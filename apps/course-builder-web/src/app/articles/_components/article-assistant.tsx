'use client'

import * as React from 'react'
import { useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { Article } from '@/lib/articles'
import { FeedbackMarker } from '@/lib/feedback-marker'
import { STREAM_COMPLETE } from '@/lib/streaming-chunk-publisher'
import { api } from '@/trpc/react'
import { EnterIcon } from '@sanity/icons'
import { useSession } from 'next-auth/react'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'
import Gravatar from 'react-gravatar'
import ReactMarkdown from 'react-markdown'

import { Button, ScrollArea, Textarea } from '@coursebuilder/ui'

export function ArticleAssistant({
  article,
  currentFeedback,
}: {
  article: Article
  currentFeedback?: FeedbackMarker[]
}) {
  const { mutate: sendArticleChatMessage } = api.articles.chat.useMutation()
  const [messages, setMessages] = React.useState<ChatCompletionRequestMessage[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useSocket({
    room: article._id,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (messageData.name === 'resource.chat.completed' && messageData.requestId === article._id) {
          setMessages(messageData.body)
        }
      } catch (error) {
        // noting to do
      }
    },
  })

  const handleSendArticleChatMessage = (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    sendArticleChatMessage({
      articleId: article._id,
      messages: [
        ...messages,
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `
          current title: ${article.title}
          current body: ${article.body}
          `,
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: event.currentTarget.value,
        },
      ],
      currentFeedback,
    })
  }

  return (
    <div className="flex h-full w-full flex-col justify-start">
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Assistant</h3>
      <ArticleChatResponse requestId={article._id} />
      <div className="flex w-full flex-col items-start border-t">
        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            className="w-full rounded-none border-0 border-b px-5 py-4 pr-10"
            placeholder="Ask Assistant..."
            rows={4}
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSendArticleChatMessage(event)
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
                handleSendArticleChatMessage(event)
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

type Message = {
  body: string
  requestId?: string
  userId?: string
}

function ArticleChatResponse({ requestId }: { requestId: string }) {
  const session = useSession()
  const [messages, setMessages] = React.useState<Message[]>([])
  const div = useRef<any>(null)
  const utils = api.useUtils()

  useSocket({
    room: requestId,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (messageData.userId) {
          // It's a user message, add it directly.
          setMessages((prev) => [
            ...prev,
            { body: messageData.body, userId: messageData.userId, requestId: messageData.requestId },
          ])
        } else {
          // It's an assistant message part, check for STREAM_COMPLETE
          if (messageData.body === STREAM_COMPLETE) {
            // When stream is complete, do not append anything.
            // If you need to handle the end of a stream (e.g., to clean up or mark as complete), do it here.
          } else {
            // It's a part of an assistant's message (streaming), append to the last assistant message.
            setMessages((prev) => {
              let lastMessage = prev[prev.length - 1]
              if (lastMessage && !lastMessage.userId && lastMessage.requestId === messageData.requestId) {
                if (typeof messageData.body !== 'object') {
                  // Continuation of the last assistant message: append the body part.
                  return [...prev.slice(0, -1), { ...lastMessage, body: lastMessage.body + messageData.body }]
                } else {
                  // If the message is an object, it's the last part of the message.
                  return [...prev.slice(0, -1), { ...lastMessage, body: lastMessage.body }]
                }
              } else {
                // New assistant message: add as a new message.
                return [...prev, { body: messageData.body, requestId: messageData.requestId }]
              }
            })
          }
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

  return (
    <ScrollArea viewportRef={div} className="h-[50vh] w-full scroll-smooth text-sm">
      {messages.length === 0 && session.status === 'authenticated' ? (
        <div className="prose prose-sm px-5">
          {`Hi ${session.data.user.name?.split(' ')[0]}, I’m your assistant and I’m here to help you get things done
          faster.`}
        </div>
      ) : null}
      {messages.map((message, index) => (
        <div key={index} className="border-b p-5">
          <MessageHeader userId={message.userId} />
          <ReactMarkdown className="prose prose-sm">{message.body}</ReactMarkdown>
        </div>
      ))}
    </ScrollArea>
  )
}

function MessageHeader({ userId }: { userId?: string }) {
  const { data: userData, status } = api.users.get.useQuery(
    {
      userId: userId as string,
    },
    {
      enabled: Boolean(userId),
    },
  )

  return (
    <div className="pb-1">
      {userId ? (
        <div className="flex items-center gap-1">
          {userData?.email && <Gravatar className="h-5 w-5 rounded-full" email={userData.email} default="mp" />}
          <strong>{userData?.name?.split(' ')[0] || 'User'}</strong>
        </div>
      ) : (
        <strong>Assistant</strong>
      )}
    </div>
  )
}
