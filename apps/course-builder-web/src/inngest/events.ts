import { FeedbackMarker } from '@/lib/feedback-marker'
import type { Session } from 'next-auth/core/types'
import { type ChatCompletionRequestMessage } from 'openai-edge'

export const AI_WRITING_COMPLETED_EVENT = 'ai/writing-completed'

export type AIWritingRequestCompleted = {
  name: typeof AI_WRITING_COMPLETED_EVENT
  data: {
    requestId: string
    result?: any
    fullPrompt: ChatCompletionRequestMessage[]
  }
}

export const BODY_TEXT_UPDATED = 'user/body-text-updated'

export type BodyTextUpdated = {
  name: typeof BODY_TEXT_UPDATED
  data: {
    resourceId: string
    content: string | null | undefined
    currentFeedback?: FeedbackMarker[]
  }
}

export const USER_CREATED_EVENT = 'user/created'

export type UserCreated = {
  name: typeof USER_CREATED_EVENT
  data: {}
}

export const TIP_CHAT_EVENT = 'tip/chat-event'

export type TipChat = {
  name: typeof TIP_CHAT_EVENT
  data: {
    tipId: string
    messages: ChatCompletionRequestMessage[]
    currentFeedback?: FeedbackMarker[]
    session: Session | null
    selectedWorkflow?: string
  }
}

export const ARTICLE_CHAT_EVENT = 'article/chat-event'

export type ArticleChat = {
  name: typeof ARTICLE_CHAT_EVENT
  data: {
    articleId: string
    messages: ChatCompletionRequestMessage[]
    currentFeedback?: FeedbackMarker[]
    session: Session | null
    selectedWorkflow?: string
  }
}

export const DRAFT_WRITEUP_COMPLETED_EVENT = 'ai/draft-writeup-completed'

export type DraftWriteupCompleted = {
  name: typeof DRAFT_WRITEUP_COMPLETED_EVENT
  data: {
    requestId: string
    result?: any
    fullPrompt: ChatCompletionRequestMessage[]
  }
}
