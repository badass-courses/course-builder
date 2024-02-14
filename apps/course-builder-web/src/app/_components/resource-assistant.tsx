import * as React from 'react'
import { useRef } from 'react'
import { ResourceChatResponse } from '@/app/_components/resource-chat-response'
import { useSocket } from '@/hooks/use-socket'
import { EnterIcon } from '@sanity/icons'
import type { ChatCompletionRequestMessage } from 'openai-edge'

import { Button, Textarea } from '@coursebuilder/ui'

export function ResourceAssistant({
  resourceId,
  handleSendMessage,
}: {
  resourceId: string
  handleSendMessage: (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
  ) => void
}) {
  const [messages, setMessages] = React.useState<ChatCompletionRequestMessage[]>([])

  useSocket({
    room: resourceId,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (messageData.name === 'resource.chat.completed' && messageData.requestId === resourceId) {
          setMessages(messageData.body)
        }
      } catch (error) {
        // noting to do
      }
    },
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="flex h-full w-full flex-col justify-start">
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Assistant</h3>
      <ResourceChatResponse requestId={resourceId} />
      <div className="flex w-full flex-col items-start border-t">
        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            className="w-full rounded-none border-0 border-b px-5 py-4 pr-10"
            placeholder="Direct Assistant..."
            rows={4}
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSendMessage(event, messages)
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
                handleSendMessage(event, messages)
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
