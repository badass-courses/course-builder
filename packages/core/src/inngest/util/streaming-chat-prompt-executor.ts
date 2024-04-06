import { type ChatCompletionRequestMessage } from 'openai-edge'

import { LlmProviderConfig } from '../../providers/openai'

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
	const result = await provider.createChatCompletion({
		messages: promptMessages,
		chatId: requestId,
		model,
	})

	return [...promptMessages, result as ChatCompletionRequestMessage]
}
