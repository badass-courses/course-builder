import {last} from "lodash";
import {promptStep} from "@/lib/prompt-step";
import type {ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum} from "openai-edge";
import {Liquid} from 'liquidjs'

const engine = new Liquid()

export async function promptActionExecutor(options: {
  action: {
    _type: string,
    role: ChatCompletionRequestMessageRoleEnum,
    name?: string,
    content?: string,
    title?: string,
  },
  input: Record<any, any>
  requestId: string,
  messages: ChatCompletionRequestMessage[],
}) {
  const {action, input, messages, requestId} = options
  if(action.role === 'system') {
    return [...messages, {role: action.role, content: action.content}]
  } else {
    const nonSystemMessages = messages.filter(message => message.role !== 'system')
    const updatedInput = last(nonSystemMessages)?.content ? {input: last(nonSystemMessages)?.content} : {...input}
    const content = await engine.parseAndRender(
      action.content || '', updatedInput)
    const userMessage = {
      role: action.role,
      ...(action.name && {name: action.name}),
      ...(action.content && {content}),
    } as ChatCompletionRequestMessage
    return await promptStep({
      requestId, promptMessages: [...messages, userMessage]
    })
  }
}