import {inngest} from "@/inngest/inngest.server"
import {AI_WRITING_COMPLETED_EVENT, AI_WRITING_REQUESTED_EVENT} from "@/inngest/events"
import {type ChatCompletionRequestMessage} from "openai-edge"
import {sanityQuery} from "@/server/sanity.server";
import {last} from "lodash";
import {env} from "@/env.mjs";
import {promptActionExecutor} from "@/lib/prompt.action-executor";
import {titles} from "@/inngest/functions/ai/data/titles";

export const writeAnEmail = inngest.createFunction(
  {id: `gpt-4-writer`, name: 'GPT-4 Writer'},
  {event: AI_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {
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
              action, input: `${event.data.input.input}\n\n ## Examples of Good Video Titles\n\n* ${titles.join('\n * ')}`,
              requestId: event.data.requestId,
              messages
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
        fullPrompt: messages
      }
    })

    await step.run('Broadcast Completion', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          body: last(messages),
          requestId: event.data.requestId,
          name: 'ai.draft.completed',
        }),
      }).catch((e) => {
        console.error(e);
      })
    })

    return {workflow, messages}
  },
)
