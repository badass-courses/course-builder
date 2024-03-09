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

export const USER_CREATED_EVENT = 'user/created'

export type UserCreated = {
  name: typeof USER_CREATED_EVENT
  data: {}
}

export const RESOURCE_CHAT_REQUEST_EVENT = 'resource/chat-request-event'

export type ResourceChat = {
  name: typeof RESOURCE_CHAT_REQUEST_EVENT
  data: {
    resourceId: string
    messages: ChatCompletionRequestMessage[]
    promptId?: string
    selectedWorkflow: string
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
