'use client'

import * as React from 'react'
import { ResourceAssistant } from '@/app/_components/resource-assistant'
import { Tip } from '@/lib/tips'
import { api } from '@/trpc/react'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'

export function TipAssistant({ tip }: { tip: Tip }) {
  const { mutate: sendTipChatMessage } = api.tips.chat.useMutation()

  const handleSendChatMessage = (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => {
    sendTipChatMessage({
      tipId: tip._id,
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
      availableWorkflows={[
        { value: 'tip-chat-response-v2', label: 'Default' },
        { value: 'taylor-transcript-draft-v1', label: 'Draft (taylor v1)', default: true },
      ]}
    />
  )
}
