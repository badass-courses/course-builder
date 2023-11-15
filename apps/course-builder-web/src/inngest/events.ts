import {type ChatCompletionRequestMessage} from "openai-edge";

export const AI_WRITING_COMPLETED_EVENT = 'ai/writing-completed'

export type AIWritingRequestCompleted = {
    name: typeof AI_WRITING_COMPLETED_EVENT
    data: {
        requestId: string
        result?: any
        fullPrompt: ChatCompletionRequestMessage[]
    }
}

export const AI_WRITING_REQUESTED_EVENT = 'ai/writing-requested'

export type AIWritingRequested = {
    name: typeof AI_WRITING_REQUESTED_EVENT
    data: {
        requestId: string
        input: Record<any, any>
    }
}

export const AI_TIP_WRITING_REQUESTED_EVENT = 'ai/tip-writing-requested'

export type AITipWritingRequested = {
    name: typeof AI_TIP_WRITING_REQUESTED_EVENT
    data: {
        tipId: string
    }
}

export const USER_CREATED_EVENT = 'user/created'

export type UserCreated = {
    name: typeof USER_CREATED_EVENT
    data: {}
}


