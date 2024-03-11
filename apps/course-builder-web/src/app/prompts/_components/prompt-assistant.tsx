import * as React from 'react'
import { ResourceAssistant } from '@/app/_components/resource-assistant'
import { sendResourceChatMessage } from '@/lib/ai-chat'
import { Prompt } from '@/lib/prompts'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'

export function PromptAssistant({ prompt }: { prompt: Prompt }) {
  const handleSendPromptChatMessage = (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => {
    sendResourceChatMessage({
      resourceId: prompt._id,
      messages: [
        ...messages,
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `## current state of prompt
          current title: ${prompt.title}
          current body: ${prompt.body}
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

  return (
    <ResourceAssistant
      resourceId={prompt._id}
      handleSendMessage={handleSendPromptChatMessage}
      availableWorkflows={[{ value: 'prompt-prompt-default-g8v77', label: 'Default', default: true }]}
    />
  )
}
