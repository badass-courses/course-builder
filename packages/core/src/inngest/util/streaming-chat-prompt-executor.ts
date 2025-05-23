import { type CoreMessage } from 'ai'

import { LlmProviderConfig } from '../../providers/openai'
import { AIMessage, type AIOutput } from '../../types'

export type ChatCompletionRequestMessage = CoreMessage

type PromptStepOptions = {
	requestId: string
	promptMessages: CoreMessage[]
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
		} as CoreMessage,
	]
}
