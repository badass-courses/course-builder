'use client'

import * as React from 'react'
import { ResourceAssistant } from '@/app/_components/resource-assistant'
import { Article } from '@/lib/articles'
import { FeedbackMarker } from '@/lib/feedback-marker'
import { api } from '@/trpc/react'
import { ChatCompletionRequestMessageRoleEnum, type ChatCompletionRequestMessage } from 'openai-edge'

export function ArticleAssistant({
  article,
  currentFeedback,
}: {
  article: Article
  currentFeedback?: FeedbackMarker[]
}) {
  const { mutate: sendArticleChatMessage } = api.articles.chat.useMutation()

  const handleSendArticleChatMessage = (
    event: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    messages: ChatCompletionRequestMessage[],
    selectedWorkflow?: string,
  ) => {
    sendArticleChatMessage({
      articleId: article._id,
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
      currentFeedback,
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
