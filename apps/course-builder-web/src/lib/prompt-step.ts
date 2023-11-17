import {ProgressWriter} from '@/types'
import {OpenAIStreamingDataPartykitChunkPublisher} from '@/lib/streaming-chunk-publisher'
import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from 'openai-edge'
import {env} from '@/env.mjs'

const config = new Configuration({apiKey: env.OPENAI_API_KEY})
const openai = new OpenAIApi(config)

type PromptStepOptions = {
  requestId: string
  promptMessages: ChatCompletionRequestMessage[]
}

export async function promptStep({
  requestId,
  promptMessages,
}: PromptStepOptions) {
  // console.log('--------')
  // console.log()
  // console.log('promptMessages', promptMessages)
  // console.log()
  // console.log()
  // console.log('--------')
  const writer: ProgressWriter = new OpenAIStreamingDataPartykitChunkPublisher(
    requestId,
  )
  let result
  const response = await openai.createChatCompletion({
    messages: promptMessages,
    stream: true,
    model: env.OPENAI_MODEL_ID,
  })

  // console.log({response})

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
