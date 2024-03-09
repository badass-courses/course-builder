import * as React from 'react'
import { ResourceAssistant } from '@/app/_components/resource-assistant'
import { sendResourceChatMessage } from '@/lib/ai-chat'
import { Article } from '@/lib/articles'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'

export function ArticleAssistant({ article }: { article: Article }) {
  const handleSendArticleChatMessage = (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => {
    sendResourceChatMessage({
      resourceId: article._id,
      messages: [
        ...messages,
        {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: `## current state of article
          current title: ${article.title}
          current body: ${article.body}
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
      resourceId={article._id}
      handleSendMessage={handleSendArticleChatMessage}
      availableWorkflows={[
        { value: 'article-chat-response', label: 'Default' },
        { value: 'taylor-transcript-draft-v1', label: 'Draft (taylor v1)', default: true },
      ]}
    />
  )
}
