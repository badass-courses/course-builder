import { User } from '@/ability'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { RESOURCE_CHAT_REQUEST_EVENT } from '@/inngest/events/resource-chat-request'
import { inngest } from '@/inngest/inngest.server'
import { getPrompt } from '@/lib/prompts-query'
import { streamingChatPromptExecutor } from '@/lib/streaming-chat-prompt-executor'
import { sql } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'
import { Liquid } from 'liquidjs'
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai-edge'
import { z } from 'zod'

const ChatResourceSchema = z.object({
  _id: z.string(),
  _type: z.string(),
  _updatedAt: z.string(),
  _createdAt: z.string(),
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  wordLevelSrt: z.string().nullable().optional(),
})

type ChatResource = z.infer<typeof ChatResourceSchema>

async function getChatResource(id: string) {
  const query = sql`
    SELECT
      resources.id as _id,
      resources.type as _type,
      resources.fields,
      CAST(resources.updatedAt AS DATETIME) as _updatedAt,
      CAST(resources.createdAt AS DATETIME) as _createdAt,
      JSON_EXTRACT (resources.fields, "$.title") AS title,
      JSON_EXTRACT (resources.fields, "$.body") AS body,
      JSON_EXTRACT (videoResources.fields, "$.transcript") AS transcript,
      JSON_EXTRACT (videoResources.fields, "$.wordLevelSrt") AS wordLevelSrt
    FROM
      ${contentResource} as resources
    -- join assumes that there is a single video resource ie a Tip
    LEFT JOIN (
      SELECT
        refs.resourceOfId,
        videoResources.fields
      FROM
        ${contentResourceResource} as refs
      JOIN ${contentResource} as videoResources
        ON refs.resourceId = videoResources.id AND videoResources.type = 'videoResource'
    ) as videoResources
      ON resources.id = videoResources.resourceOfId 
    WHERE
      resources.id = ${id};
  `

  return db
    .execute(query)
    .then((result) => {
      console.log('📼 get chat resource', result)
      const parsed = ChatResourceSchema.safeParse(result.rows[0])
      return parsed.success ? parsed.data : null
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}

/**
 * TODO: Cancellation conditions need to be added $$
 */
export const resourceChat = inngest.createFunction(
  {
    id: `resource-chat`,
    name: 'Resource Chat',
    rateLimit: {
      key: 'event.user.id',
      limit: 5,
      period: '1m',
    },
  },
  {
    event: RESOURCE_CHAT_REQUEST_EVENT,
  },
  async ({ event, step }) => {
    const resourceId = event.data.resourceId
    const workflowTrigger = event.data.selectedWorkflow

    const resource = await step.run('get the resource', async () => {
      return getChatResource(resourceId)
    })

    if (!resource) {
      throw new NonRetriableError(`Resource not found for id (${resourceId})`)
    }

    const messages = await resourceChatWorkflowExecutor({
      step,
      workflowTrigger,
      resourceId,
      resource,
      messages: event.data.messages,
      user: event.user,
    })

    return { resource, messages }
  },
)

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
 */
export async function resourceChatWorkflowExecutor({
  step,
  workflowTrigger,
  resourceId,
  messages,
  resource,
  user,
}: {
  resource: ChatResource
  step: any
  workflowTrigger: string
  resourceId: string
  messages: ChatCompletionRequestMessage[]
  user: User
}) {
  const prompt = await step.run('Load Prompt', async () => {
    return await getPrompt(workflowTrigger)
  })

  if (!prompt) {
    throw new NonRetriableError(`Prompt not found for id (${workflowTrigger})`)
  }

  let systemPrompt: ChatCompletionRequestMessage = {
    role: 'system',
    content: prompt.body,
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
      .parse(JSON.parse(prompt.body))

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
          role: 'system',
          content: prompt.body,
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
          role: 'system',
          content: prompt.body,
        }
      }
    })
  }

  if (messages.length <= 2 && systemPrompt) {
    messages = [systemPrompt, ...seedMessages, ...messages]
  }

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
          userId: user.id,
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
