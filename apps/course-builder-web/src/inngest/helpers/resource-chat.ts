import { env } from '@/env.mjs'
import { FeedbackMarker } from '@/lib/feedback-marker'
import { promptActionExecutor } from '@/lib/prompt.action-executor'
import { streamingChatPromptExecutor } from '@/lib/streaming-chat-prompt-executor'
import { sanityQuery } from '@/server/sanity.server'
import { Liquid } from 'liquidjs'
import type { Session } from 'next-auth'
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai-edge'
import { z } from 'zod'

/**
 * loads the workflow from sanity based on the trigger and then executes the workflow using the `resource` as
 * input that is parsed by liquid into the prompt
 *
 * This treats the system prompt as "special" from the loaded workflow since it is added to the beginning of the prompt
 * in the chat context, but additional steps are executed as normal
 *
 * @param step
 * @param workflowTrigger
 * @param resourceId
 * @param messages
 * @param resource
 * @param currentFeedback
 * @param session
 */
export async function resourceChat({
  step,
  workflowTrigger,
  resourceId,
  messages,
  resource,
  currentFeedback,
  session,
}: {
  currentFeedback?: FeedbackMarker[]
  resource: any
  step: any
  workflowTrigger: string
  resourceId: string
  messages: ChatCompletionRequestMessage[]
  session: Session | null
}) {
  const workflow = await step.run('Load Workflow', async () => {
    return await sanityQuery(
      `*[_type == "workflow" && (slug.current == "${workflowTrigger}" || trigger == "${workflowTrigger}")][0]`,
      { useCdn: false },
    )
  })

  const systemPromptAction = workflow.actions.find(
    (action: { _type: string; role: string }) => action._type === 'prompt' && action.role === 'system',
  )

  let systemPrompt: ChatCompletionRequestMessage = {
    role: systemPromptAction.role,
    content: systemPromptAction.content,
  }
  let seedMessages: ChatCompletionRequestMessage[] = []

  try {
    const actionParsed = z
      .array(
        z.object({
          role: z.enum([
            ChatCompletionRequestMessageRoleEnum.System,
            ChatCompletionRequestMessageRoleEnum.User,
            ChatCompletionRequestMessageRoleEnum.Assistant,
            ChatCompletionRequestMessageRoleEnum.Function,
          ]),
          content: z.string(),
        }),
      )
      .parse(JSON.parse(systemPromptAction.content))

    const actionMessages: ChatCompletionRequestMessage[] = []
    for (const actionMessage of actionParsed) {
      const liquidParsedContent = await step.run('parse json content', async () => {
        const engine = new Liquid()
        return await engine.parseAndRender(actionMessage.content, { ...resource })
      })

      actionMessages.push({
        role: actionMessage.role,
        content: liquidParsedContent,
      })
    }
    if (actionMessages.length > 0) {
      ;[
        systemPrompt = {
          role: systemPromptAction.role,
          content: systemPromptAction.content,
        },
        ...seedMessages
      ] = actionMessages
    }
  } catch (e: any) {
    // if the prompt action content is not valid json, we assume it's just text
    systemPrompt = await step.run(`parse system prompt`, async () => {
      try {
        const engine = new Liquid()
        return {
          role: systemPrompt.role,
          content: await engine.parseAndRender(systemPrompt.content || '', resource),
        }
      } catch (e: any) {
        console.error(e.message)
        return {
          role: systemPromptAction.role,
          content: systemPromptAction.content,
        }
      }
    })
  }

  if (messages.length <= 2 && systemPrompt) {
    if (currentFeedback) {
      messages = [
        {
          content: JSON.stringify(currentFeedback),
          role: 'system',
        },
        ...messages,
      ]
    }
    messages = [systemPrompt, ...seedMessages, ...messages]
  }

  const systemPromptIndex = workflow.actions.findIndex(
    (item: any) => item.content === systemPrompt.content && item.role === systemPrompt.role,
  )

  workflow.actions.splice(systemPromptIndex, 1)

  const currentUserMessage = messages[messages.length - 1]
  const currentResourceMetadata = messages[messages.length - 2]

  if (currentUserMessage?.content) {
    await step.run(`partykit broadcast user prompt [${resourceId}]`, async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${resourceId}`, {
        method: 'POST',
        body: JSON.stringify({
          body: currentUserMessage.content,
          requestId: resourceId,
          name: 'resource.chat.prompted',
          userId: session?.user.id,
        }),
      }).catch((e) => {
        console.error(e)
      })
    })
  }

  messages = await step.run('answer the user prompt', async () => {
    if (!currentUserMessage) {
      throw new Error('No user message')
    }
    const engine = new Liquid()
    currentUserMessage.content = await engine.parseAndRender(currentUserMessage.content ?? '', resource)
    if (currentResourceMetadata) {
      currentResourceMetadata.content = await engine.parseAndRender(currentResourceMetadata.content ?? '', resource)
    }
    return streamingChatPromptExecutor({
      requestId: resourceId,
      promptMessages: messages,
    })
  })

  let shouldContinue = Boolean(workflow && workflow.actions.length > 0)

  // if the workflow has additional steps, do them now
  while (shouldContinue) {
    const action = workflow.actions.shift()
    switch (action._type) {
      case 'prompt':
        messages = await step.run(action.title, async () => {
          return await promptActionExecutor({
            action,
            input: resource,
            requestId: resourceId,
            messages,
          })
        })
        break
      default:
        shouldContinue = false
    }
  }

  await step.run(`partykit broadcast [${resourceId}]`, async () => {
    return await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${resourceId}`, {
      method: 'POST',
      body: JSON.stringify({
        body: messages,
        requestId: resourceId,
        name: 'resource.chat.completed',
      }),
    })
      .then((res) => {
        return res.text()
      })
      .catch((e) => {
        console.error(e)
      })
  })

  return messages
}
