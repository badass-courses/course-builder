import {
	ChatCompletionRequestMessage,
	Configuration,
	OpenAIApi,
} from 'openai-edge'

import { OpenAIStreamingDataPartykitChunkPublisher } from '../inngest/util/streaming-chunk-publisher'
import { AIOutput, ProgressWriter } from '../types'

export interface LlmProviderConfig {
	id: string
	name: string
	type: string
	options: LlmProviderConsumerConfig
	apiKey: string
	partyUrlBase: string
	baseUrl?: string
	defaultModel?: string
	createChatCompletion: (
		options: CreateChatCompletionOptions,
	) => Promise<AIOutput | null>
}

export type LlmProviderConsumerConfig = Omit<
	Partial<LlmProviderConfig>,
	'options' | 'type'
> & {
	apiKey: string
	partyUrlBase: string
	baseUrl?: string
	defaultModel?: string
}

export type CreateChatCompletionOptions = {
	messages: ChatCompletionRequestMessage[]
	chatId: string
	model: string
}

export default function OpenAIProvider(
	options: LlmProviderConsumerConfig,
): LlmProviderConfig {
	const config = new Configuration({
		apiKey: options.apiKey,
		...(options.baseUrl && {
			baseUrl: options.baseUrl,
		}),
	})
	const openai = new OpenAIApi(config)
	return {
		id: 'openai',
		name: 'OpenAI',
		type: 'llm',
		options,
		...options,
		createChatCompletion: async (
			createChatOptions: CreateChatCompletionOptions,
		) => {
			const writer: ProgressWriter =
				new OpenAIStreamingDataPartykitChunkPublisher(
					createChatOptions.chatId,
					options.partyUrlBase,
				)
			let result
			const response = await openai.createChatCompletion({
				messages: createChatOptions.messages,
				stream: true,
				model: createChatOptions.model || options.defaultModel || 'gpt-4o',
			})
			if (response.status >= 400) {
				result = await response.json()
				throw new Error(
					result?.error?.message
						? (result.error.message as string)
						: 'There was an error with openAI',
					{
						cause: result,
					},
				)
			}
			try {
				result = await writer.writeResponseInChunks(response)
			} catch (e) {
				console.warn((e as Error).message, e)
			} finally {
				await writer.publishMessage(`\n\n`)
			}
			return result || null
		},
	} as const
}

export const MockOpenAIProvider: LlmProviderConfig = {
	id: 'mock-openai' as const,
	name: 'Mock OpenAI',
	type: 'llm',
	options: {
		apiKey: 'mock-api-key',
		partyUrlBase: 'mock-callback-url',
	},
	apiKey: 'mock-api-key',
	partyUrlBase: 'mock-callback-url',
	createChatCompletion: () => Promise.resolve(null),
}
