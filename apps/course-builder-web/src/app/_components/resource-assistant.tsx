import * as React from 'react'
import { useRef } from 'react'
import { AssistantWorkflowSelector } from '@/app/_components/assistant-workflow-selector'
import { ResourceChatResponse } from '@/app/_components/resource-chat-response'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/utils/cn'
import { EnterIcon } from '@sanity/icons'
import { SquareIcon } from 'lucide-react'
import type { ChatCompletionRequestMessage } from 'openai-edge'

import { Button, Textarea } from '@coursebuilder/ui'

export function ResourceAssistant({
  resourceId,
  handleSendMessage,
  availableWorkflows = [{ value: 'summarize', label: 'Summarize', default: true }],
}: {
  resourceId: string
  handleSendMessage: (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => void
  availableWorkflows?: { value: string; label: string; default?: boolean }[]
}) {
  const [messages, setMessages] = React.useState<ChatCompletionRequestMessage[]>([])
  const [streamingActive, setStreamingActive] = React.useState<boolean>(false)
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<string>(
    availableWorkflows.find((w) => w.default)?.value || 'summarize',
  )

  useSocket({
    room: resourceId,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (messageData.name === 'resource.chat.completed' && messageData.requestId === resourceId) {
          // setStreamingActive(false)
          setMessages(messageData.body)
        }
      } catch (error) {
        setStreamingActive(false)
      }
    },
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="flex h-full w-full flex-col justify-start">
      <div>
        <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Assistant</h3>
        {availableWorkflows.length > 1 && (
          <AssistantWorkflowSelector
            initialValue={selectedWorkflow}
            onValueChange={(value) => {
              setSelectedWorkflow(value || selectedWorkflow)
            }}
            availableWorkflows={availableWorkflows}
          />
        )}
      </div>
      <ResourceChatResponse requestId={resourceId} setStreamingActive={setStreamingActive} />
      <div className="flex w-full flex-col items-start border-t">
        <div className="relative w-full">
          <Textarea
            ref={textareaRef}
            className="w-full rounded-none border-0 border-b px-5 py-4 pr-10"
            placeholder="Direct Assistant..."
            rows={4}
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey && !streamingActive) {
                event.preventDefault()
                handleSendMessage(event, messages, selectedWorkflow)
                event.currentTarget.value = ''
              }
            }}
          />
          <Button
            type="button"
            className={cn(
              'absolute right-2 top-2 flex h-6 w-6 items-center justify-center p-0',
              streamingActive ? 'text-gray-400' : 'text-gray-600',
            )}
            variant="outline"
            onClick={async (event) => {
              event.preventDefault()
              if (textareaRef.current && !streamingActive) {
                handleSendMessage(event, messages, selectedWorkflow)
                textareaRef.current.value = ''
              } else if (streamingActive) {
                // cancel the streaming
              }
            }}
          >
            {streamingActive ? <SquareIcon className="w-4" /> : <EnterIcon className="w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
