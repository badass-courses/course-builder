import {type ProgressWriter} from '@/types'
import {OpenAIStreamingDataPartykitChunkPublisher} from '@/lib/streaming-chunk-publisher'
import {
  type ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from 'openai-edge'
import {env} from '@/env.mjs'

const config = new Configuration({apiKey: env.OPENAI_API_KEY})
const openai = new OpenAIApi(config)

type PromptStepOptions = {
  requestId: string
  promptMessages: ChatCompletionRequestMessage[]
  model?: string
}

export async function streamingChatPromptExecutor({
  requestId,
  promptMessages,
  model,
}: PromptStepOptions) {
  const writer: ProgressWriter = new OpenAIStreamingDataPartykitChunkPublisher(
    requestId,
  )
  let result
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
  return [...promptMessages, result as ChatCompletionRequestMessage]
}
