import * as React from 'react'
import { useRef } from 'react'
import { AssistantWorkflowSelector } from '@/app/_components/assistant-workflow-selector'
import { ResourceChatResponse } from '@/components/chat-assistant/resource-chat-response'
import { useSocket } from '@/hooks/use-socket'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { EnterIcon } from '@sanity/icons'
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from 'openai-edge'

import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Textarea,
} from '@coursebuilder/ui'

export function ResourceChatAssistant({
  resource,
  availableWorkflows = [
    { value: 'summarize', label: 'Summarize', default: true },
  ],
}: {
  resource: {
    _type: string
    _id: string
    body?: string | null
    title?: string | null
  }

  availableWorkflows?: { value: string; label: string; default?: boolean }[]
}) {
  const [messages, setMessages] = React.useState<
    ChatCompletionRequestMessage[]
  >([])
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<string>(
    availableWorkflows.find((w) => w.default)?.value || 'summarize',
  )

  const handleSendMessage = (
    event:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => {
    sendResourceChatMessage({
      resourceId: resource._id,
      messages: [
        ...messages,
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `## current state of article
          current title: ${resource.title}
          current body: ${resource.body}
          `,
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: event.currentTarget.value,
        },
      ],
      selectedWorkflow,
    })
  }

  useSocket({
    room: resource._id,
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)

        if (
          messageData.name === 'resource.chat.completed' &&
          messageData.requestId === resource._id
        ) {
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
        <ResizablePanel defaultSize={85} className="none">
          <ResourceChatResponse requestId={resource._id} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={15}
          minSize={5}
          className="relative flex w-full flex-col items-start"
        >
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
