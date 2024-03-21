import { env } from '@/env.mjs'
import {
	OpenAIStreamingDataPartykitChunkPublisher,
	publishToPartykit,
} from '@/lib/streaming-chunk-publisher'
import { type ProgressWriter } from '@/types'
import Anthropic from '@anthropic-ai/sdk'
import { MessageParam } from '@anthropic-ai/sdk/resources/index.mjs'
import {
	Configuration,
	OpenAIApi,
	type ChatCompletionRequestMessage,
} from 'openai-edge'

const config = new Configuration({ apiKey: env.OPENAI_API_KEY })
const openai = new OpenAIApi(config)

const client = new Anthropic({
	apiKey: env.ANTHROPIC_API_KEY,
})

type PromptStepOptions = {
	requestId: string
	promptMessages: ChatCompletionRequestMessage[]
	model?: string
	provider?: 'openai' | 'anthropic'
}

export async function streamingChatPromptExecutor({
	requestId,
	promptMessages,
	model,
	provider = 'openai',
}: PromptStepOptions) {
	const writer: ProgressWriter = new OpenAIStreamingDataPartykitChunkPublisher(
		requestId,
	)
	let result

	if (provider === 'openai') {
		const response = await openai.createChatCompletion({
			messages: promptMessages,
			stream: true,
			model: model ?? env.OPENAI_MODEL_ID,
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
	} else if (provider === 'anthropic') {
		const messages = promptMessages.filter(
			(msg) => msg && msg.role !== 'system',
		) as MessageParam[]
		const streamArgs = {
			system: promptMessages.reduce((acc, msg) => {
				if (msg && msg.role === 'system') {
					acc += `${msg.content}\n`
				}
				return acc
			}, ''),
			messages,
			model: 'claude-3-opus-20240229',
			max_tokens: 2048,
		}
		const readableStream = client.messages
			.stream(streamArgs)
			.on('text', (text) => {
				publishToPartykit(text, requestId)
			})
			.on('error', (error) => {
				console.error(error)
				throw new Error('There was an error with Anthropic', { cause: error })
			})
			.on('finalMessage', (message) => {
				result = message
			})

		result = await readableStream.finalMessage().then((message) => {
			return {
				role: 'assistant',
				content: message.content.reduce((acc, content) => {
					return content.text ? acc + content.text : acc
				}, ''),
			}
		})
	}

	return [...promptMessages, result as ChatCompletionRequestMessage]
}
