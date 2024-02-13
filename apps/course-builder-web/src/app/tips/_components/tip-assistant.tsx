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
  ) => {
    sendTipChatMessage({
      tipId: tip._id,
      messages: [
        ...messages,
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `current title: ${tip.title}\n\ncurrent body: ${tip.body}`,
        },
        {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: event.currentTarget.value,
        },
      ],
    })
  }

  return <ResourceAssistant resourceId={tip._id} handleSendMessage={handleSendChatMessage} />
}
