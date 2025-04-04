// Removed import of ChatCompletionRequestMessage from '@ai-sdk/openai'

import { LlmProviderConfig } from '../../providers/openai'
import { AIError, AIMessage, type AIOutput } from '../../types'

// Define ChatCompletionRequestMessage type
export type ChatCompletionRequestMessage = {
	role: 'system' | 'user' | 'assistant' | 'function'
	content: string | undefined
}

type PromptStepOptions = {
	requestId: string
	promptMessages: ChatCompletionRequestMessage[]
	model: string
	provider: LlmProviderConfig
}

export async function streamingChatPromptExecutor({
	requestId,
	promptMessages,
	model,
	provider,
}: PromptStepOptions) {
	const result: AIOutput | null = await provider.createChatCompletion({
		messages: promptMessages,
		chatId: requestId,
		model,
	})

	if (!result) {
		throw new Error('Chat completion returned null')
	}

	if ('error' in result) {
		throw new Error(result.error)
	}

	const message = result as AIMessage
	return [
		...promptMessages,
		{
			role: 'assistant',
			content: message.content,
		} as ChatCompletionRequestMessage,
	]
}
