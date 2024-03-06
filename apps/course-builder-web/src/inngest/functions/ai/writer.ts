import { env } from '@/env.mjs'
import { MUX_SRT_READY_EVENT } from '@/inngest/events/mux-add-srt-to-asset'
import { inngest } from '@/inngest/inngest.server'
import { streamingChatPromptExecutor } from '@/lib/streaming-chat-prompt-executor'
import { getVideoResource } from '@/lib/video-resource-query'
import { sanityQuery } from '@/server/sanity.server'
import { NonRetriableError } from 'inngest'
import { Liquid } from 'liquidjs'
import { type ChatCompletionRequestMessage } from 'openai-edge'

export const writeResourceBody = inngest.createFunction(
  { id: `gpt-4-draft-writer`, name: 'GPT-4 Draft Writer' },
  { event: MUX_SRT_READY_EVENT },
  async ({ event, step }) => {
    const workflow = await step.run('Load Workflow', async () => {
      return await sanityQuery(`*[_type == "workflow" && trigger == 'ai/draft-writeup-requested'][0]`)
    })

    const videoResource = await step.run('get the video resource from Sanity', async () => {
      return await getVideoResource(event.data.videoResourceId)
    })

    if (!videoResource) {
      throw new NonRetriableError(`Video resource not found for id (${event.data.videoResourceId})`)
    }

    let shouldContinue = Boolean(workflow)
    let messages: ChatCompletionRequestMessage[] = []
    const engine = new Liquid()

    while (workflow.actions.length > 0 && shouldContinue) {
      const action = workflow.actions.shift()
      switch (action._type) {
        case 'prompt':
          messages = await step.run(action.title, async () => {
            return await streamingChatPromptExecutor({
              requestId: event.data.videoResourceId,
              promptMessages: [
                ...messages,
                {
                  role: action.role,
                  content: await engine.parseAndRender(action.content ?? '', {
                    transcript: videoResource.transcript,
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

    return { workflow, messages }
  },
)
