import { streamingChatPromptExecutor } from '@/lib/streaming-chat-prompt-executor'
import { Liquid } from 'liquidjs'
import { last } from 'lodash'
import { type ChatCompletionRequestMessage, type ChatCompletionRequestMessageRoleEnum } from 'openai-edge'

const engine = new Liquid()

export async function promptActionExecutor(options: {
  action: {
    _type: string
    role: ChatCompletionRequestMessageRoleEnum
    name?: string
    content?: string
    title?: string
    model?: string
  }
  input: Record<any, any>
  requestId: string
  messages: ChatCompletionRequestMessage[]
}) {
  const { action, input, messages, requestId } = options
  if (action.role === 'system') {
    return [...messages, { role: action.role, content: action.content }]
  } else {
    const nonSystemMessages = messages.filter((message) => message.role !== 'system')
    const updatedInput = last(nonSystemMessages)?.content ? { input: last(nonSystemMessages)?.content } : { ...input }
    const content = await engine.parseAndRender(action.content || '', updatedInput)
    const userMessage = {
      role: action.role,
      ...(action.name && { name: action.name }),
      ...(action.content && { content }),
    } as ChatCompletionRequestMessage
    return await streamingChatPromptExecutor({
      requestId,
      promptMessages: [...messages, userMessage],
      model: action.model,
    })
  }
}
