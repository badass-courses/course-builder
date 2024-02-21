import * as React from 'react'
import { useRef } from 'react'
import { AssistantWorkflowSelector } from '@/app/_components/assistant-workflow-selector'
import { ResourceChatResponse } from '@/app/_components/resource-chat-response'
import { useSocket } from '@/hooks/use-socket'
import { EnterIcon } from '@sanity/icons'
import type { ChatCompletionRequestMessage } from 'openai-edge'

import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup, Textarea } from '@coursebuilder/ui'

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
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<string>(
    availableWorkflows.find((w) => w.default)?.value || 'summarize',
  )

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
      <div className="flex items-center justify-between gap-10 border-b p-5">
        <h3 className="inline-flex text-lg font-bold">Assistant</h3>
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
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={85}>
          <ResourceChatResponse requestId={resourceId} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={15} minSize={5} className="relative flex w-full flex-col items-start">
          <Textarea
            ref={textareaRef}
            className="w-full flex-grow rounded-none border-0 px-5 py-4 pr-10 focus-visible:ring-0"
            placeholder="Direct Assistant..."
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSendMessage(event, messages, selectedWorkflow)
                event.currentTarget.value = ''
              }
            }}
          />
          <Button
            type="button"
            className="absolute right-2 top-4 flex h-6 w-6 items-center justify-center p-0"
            variant="outline"
            onClick={async (event) => {
              event.preventDefault()
              if (textareaRef.current) {
                handleSendMessage(event, messages, selectedWorkflow)
                textareaRef.current.value = ''
              }
            }}
          >
            <EnterIcon className="w-4" />
          </Button>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
