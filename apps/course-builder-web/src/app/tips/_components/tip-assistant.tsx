import * as React from 'react'
import { ResourceAssistant } from '@/app/_components/resource-assistant'
import { sendResourceChatMessage } from '@/lib/ai-chat'
import { Tip } from '@/lib/tips'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'

export function TipAssistant({ tip }: { tip: Tip }) {
  const handleSendChatMessage = (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => {
    sendResourceChatMessage({
      resourceId: tip._id,
      messages: [
        ...messages,
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `## current state of tip
          current title: ${tip.title}
          current body: ${tip.body}`,
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: event.currentTarget.value,
        },
      ],
      selectedWorkflow,
    })
  }

  return (
    <ResourceAssistant
      resourceId={tip._id}
      handleSendMessage={handleSendChatMessage}
      availableWorkflows={[{ value: 'tip-chat-default-okf8v', label: 'Default', default: true }]}
    />
  )
}
