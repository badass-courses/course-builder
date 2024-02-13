import { env } from '@/env.mjs'
import {
  AI_WRITING_COMPLETED_EVENT,
  AI_WRITING_REQUESTED_EVENT,
  DRAFT_WRITEUP_COMPLETED_EVENT,
  DRAFT_WRITEUP_REQUESTED_EVENT,
} from '@/inngest/events'
import { titles } from '@/inngest/functions/ai/data/titles'
import { inngest } from '@/inngest/inngest.server'
import { promptActionExecutor } from '@/lib/prompt.action-executor'
import { streamingChatPromptExecutor } from '@/lib/streaming-chat-prompt-executor'
import { sanityQuery } from '@/server/sanity.server'
import { Liquid } from 'liquidjs'
import { last } from 'lodash'
import { type ChatCompletionRequestMessage } from 'openai-edge'

export const writeAnEmail = inngest.createFunction(
  { id: `gpt-4-writer`, name: 'GPT-4 Writer' },
  { event: AI_WRITING_REQUESTED_EVENT },
  async ({ event, step }) => {
    const workflow = await step.run('Load Workflow', async () => {
      return await sanityQuery(`*[_type == "workflow" && trigger == '${AI_WRITING_REQUESTED_EVENT}'][0]`)
    })

    let shouldContinue = Boolean(workflow)
    let messages: ChatCompletionRequestMessage[] = []

    while (workflow.actions.length > 0 && shouldContinue) {
      const action = workflow.actions.shift()
      switch (action._type) {
        case 'prompt':
          messages = await step.run(action.title, async () => {
            return await promptActionExecutor({
              action,
              input: {
                input: `${event.data.input.input}\n\n ## Examples of Good Video Titles\n\n* ${titles.join('\n * ')}`,
              },
              requestId: event.data.requestId,
              messages,
            })
          })
          break
        default:
          shouldContinue = false
      }
    }

    await step.sendEvent('Announce Completion', {
      name: AI_WRITING_COMPLETED_EVENT,
      data: {
        requestId: event.data.requestId,
        result: last(messages),
        fullPrompt: messages,
      },
    })

    await step.run('Broadcast Completion', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${event.data.requestId}`, {
        method: 'POST',
        body: JSON.stringify({
          body: last(messages),
          requestId: event.data.requestId,
          name: 'ai.draft.completed',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    return { workflow, messages }
  },
)

export const writeDraft = inngest.createFunction(
  { id: `gpt-4-draft-writer`, name: 'GPT-4 Draft Writer' },
  { event: DRAFT_WRITEUP_REQUESTED_EVENT },
  async ({ event, step }) => {
    const workflow = await step.run('Load Workflow', async () => {
      return await sanityQuery(`*[_type == "workflow" && trigger == '${DRAFT_WRITEUP_REQUESTED_EVENT}'][0]`)
    })

    let shouldContinue = Boolean(workflow)
    let messages: ChatCompletionRequestMessage[] = []
    const engine = new Liquid()

    while (workflow.actions.length > 0 && shouldContinue) {
      const action = workflow.actions.shift()
      switch (action._type) {
        case 'prompt':
          messages = await step.run(action.title, async () => {
            return await streamingChatPromptExecutor({
              requestId: event.data.requestId,
              promptMessages: [
                ...messages,
                {
                  role: action.role,
                  content: await engine.parseAndRender(action.content ?? '', {
                    transcript: event.data.transcript,
                  }),
                },
              ],
              model: action.model,
            })
          })
          break
        default:
          shouldContinue = false
      }
    }

    await step.sendEvent('Announce Completion', {
      name: DRAFT_WRITEUP_COMPLETED_EVENT,
      data: {
        requestId: event.data.requestId,
        result: last(messages),
        fullPrompt: messages,
      },
    })

    return { workflow, messages }
  },
)
