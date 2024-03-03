import * as React from 'react'
import { useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { STREAM_COMPLETE } from '@/lib/streaming-chunk-publisher'
import { api } from '@/trpc/react'
import { useSession } from 'next-auth/react'
import Gravatar from 'react-gravatar'
import ReactMarkdown from 'react-markdown'

import { ScrollArea } from '@coursebuilder/ui'

type Message = {
  body: string
  requestId?: string
  userId?: string
}

export function ResourceChatResponse({ requestId }: { requestId: string }) {
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
          } else if (messageData.name === 'code.extraction.completed') {
            console.log('code extraction completed', messageData.body)
            setMessages((prevMessages) => {
              console.log([...prevMessages, { body: messageData.body, requestId: messageData.requestId }])
              return [...prevMessages, { body: messageData.body.content, requestId: messageData.requestId }]
            })
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
    <ScrollArea viewportRef={div} className="h-full w-full scroll-smooth text-sm">
      {messages.length === 0 && session.status === 'authenticated' ? (
        <div className="prose prose-sm dark:prose-invert p-5">
          {`Hi ${session.data.user.name?.split(' ')[0]}, I’m your assistant and I’m here to help you get things done
          faster.`}
        </div>
      ) : null}
      {messages.map((message, index) => (
        <div key={index} className="border-b p-5 last-of-type:border-b-0">
          <MessageHeader userId={message.userId} />
          <ReactMarkdown className="prose prose-sm dark:prose-invert">{message.body}</ReactMarkdown>
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
