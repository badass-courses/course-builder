import type { ChatCompletionRequestMessage } from 'openai-edge'

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
