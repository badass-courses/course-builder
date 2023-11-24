import {inngest} from '@/inngest/inngest.server'
import {
  AI_TIP_WRITING_REQUESTED_EVENT,
  AI_WRITING_COMPLETED_EVENT,
} from '@/inngest/events'
import {type ChatCompletionRequestMessage} from 'openai-edge'
import {sanityQuery} from '@/server/sanity.server'
import {last} from 'lodash'
import {env} from '@/env.mjs'
import {promptActionExecutor} from '@/lib/prompt.action-executor'
import {titles} from '@/inngest/functions/ai/data/titles'
import {type Tip} from '@/lib/tips'
import {type VideoResource} from '@/inngest/functions/transcript-ready'

export const tipTitleAndSummaryWriter = inngest.createFunction(
  {id: `gpt-4-tip-writer`, name: 'GPT-4 Writer'},
  {event: AI_TIP_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {
    const workflow = await step.run('Load Workflow', async () => {
      return await sanityQuery(
        `*[_type == "workflow" && trigger == '${AI_TIP_WRITING_REQUESTED_EVENT}'][0]`,
      )
    })

    const tip = await step.run('Load Tip', async () => {
      return await sanityQuery<Tip>(`*[_type == "tip" && _id == '${event.data.tipId}'][0]{
        _id,
        _type,
        "_updatedAt": ^._updatedAt,
        title,
        summary,
        body,
        "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
        "transcript": resources[@->._type == 'videoResource'][0]->transcript,
        "slug": slug.current,
      }`)
    })

    const videoResource = await step.run('Load Video Resource', async () => {
      return await sanityQuery<VideoResource>(
        `*[_type == "videoResource" && _id == '${tip.videoResourceId}'][0]`,
      )
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
                transcript: `${
                  videoResource.transcript
                }\n\n ## Examples of Good Video Titles\n\n* ${titles.join(
                  '\n * ',
                )}`,
                summary: tip.title,
              },
              requestId: videoResource._id,
              messages,
            })
          })
          break
        default:
          shouldContinue = false
      }
    }

    const finalMessage = JSON.parse(last(messages)?.content || '{}')

    await step.sendEvent('Announce Completion', {
      name: AI_WRITING_COMPLETED_EVENT,
      data: {
        requestId: videoResource._id,
        result: finalMessage,
        fullPrompt: messages,
      },
    })

    await step.run('Broadcast Completion', async () => {
      await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: finalMessage,
            requestId: videoResource._id,
            name: 'ai.tip.draft.completed',
          }),
        },
      ).catch((e) => {
        console.error(e)
      })
    })

    return finalMessage
  },
)
