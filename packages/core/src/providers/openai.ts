import { createOpenAI } from '@ai-sdk/openai'
import { streamText, type CoreMessage } from 'ai'

import { AIOutput } from '../types'

export const STREAM_COMPLETE = `\\ok`

/**
 * PartyKit chunk publisher that buffers and sends chunks at intervals
 * to maintain the expected streaming behavior for the UI
 */
class PartyKitChunkPublisher {
	requestId: string
	interval = 250
	buffer: {
		contents: string
		signal?: Promise<unknown>
	}
	partyUrl: string

	constructor(requestId: string, partyUrlBase: string) {
		this.requestId = requestId
		this.buffer = {
			contents: '',
		}
		this.partyUrl = `${partyUrlBase}/party/${requestId}`
	}

	async publishMessage(message: string) {
		await this.sendToPartyKit(message, this.requestId, this.partyUrl)
	}

	async appendToBufferAndPublish(text: string) {
		let resolve = (_val?: any) => {}
		this.buffer.contents += text

		if (this.buffer.signal) {
			// Already enqueued.
			return
		}

		this.buffer.signal = new Promise((r) => {
			resolve = r
		})

		setTimeout(() => {
			if (this.buffer.contents.length === 0) {
				resolve()
				return
			}
			this.sendToPartyKit(this.buffer.contents, this.requestId, this.partyUrl)
			resolve()
			this.buffer = {
				contents: '',
			}
		}, this.interval)
	}

	async waitForBuffer() {
		await this.buffer.signal
	}

	private async sendToPartyKit(
		body: string,
		requestId: string,
		partyUrl: string,
	) {
		return await fetch(partyUrl, {
			method: 'POST',
			body: JSON.stringify({
				body,
				requestId,
				name: 'ai.message',
			}),
		}).catch((e) => {
			console.error('Failed to send chunk to PartyKit:', e)
		})
	}
}

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
	messages: CoreMessage[]
	chatId: string
	model: string
}

export default function OpenAIProvider(
	options: LlmProviderConsumerConfig,
): LlmProviderConfig {
	const client = createOpenAI({
		apiKey: options.apiKey,
		...(options.baseUrl && {
			baseURL: options.baseUrl,
		}),
	})

	return {
		id: 'openai',
		name: 'OpenAI',
		type: 'llm',
		options,
		...options,
		createChatCompletion: async (
			createChatOptions: CreateChatCompletionOptions,
		) => {
			try {
				const modelName =
					createChatOptions.model || options.defaultModel || 'gpt-4o'

				// Create PartyKit publisher with buffering behavior
				const publisher = new PartyKitChunkPublisher(
					createChatOptions.chatId,
					options.partyUrlBase,
				)

				const result = await streamText({
					model: client(modelName),
					messages: createChatOptions.messages,
					onChunk: async ({ chunk }) => {
						if (chunk.type === 'text-delta') {
							// Use the buffered publisher to maintain expected streaming behavior
							await publisher.appendToBufferAndPublish(chunk.textDelta)
						}
					},
				})

				// We need to consume the stream to make result.text resolve
				// Since we're already handling chunks in onChunk, we can consume textStream to completion
				let fullText = ''
				for await (const textPart of result.textStream) {
					fullText += textPart
				}

				// Wait for any remaining buffered content to be sent
				await publisher.waitForBuffer()

				// Send completion signal using the expected format
				await publisher.publishMessage(STREAM_COMPLETE)

				return {
					role: 'assistant',
					content: fullText,
				}
			} catch (error) {
				console.error('OpenAI streaming error:', error)
				throw error
			}
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
