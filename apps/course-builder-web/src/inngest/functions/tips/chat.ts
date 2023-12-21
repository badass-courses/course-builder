import {inngest} from '@/inngest/inngest.server'
import {TIP_CHAT_EVENT} from '@/inngest/events'

import {getTip} from '@/lib/tips'
import {promptStep} from '@/lib/prompt-step'
import {env} from '@/env.mjs'

export const tipChat = inngest.createFunction(
  {
    id: `tip-chat`,
    name: 'Tip Chat',
  },
  {
    event: TIP_CHAT_EVENT,
  },
  async ({event, step}) => {
    const tip = await step.run(`load tip`, async () => {
      return await getTip(event.data.tipId)
    })

    const aiResponse = await step.run(
      'send to writer for first draft',
      async () => {
        return promptStep({
          requestId: event.data.tipId,
          promptMessages: [...event.data.messages],
        })
      },
    )

    await step.run('Broadcast Completion', async () => {
      await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: aiResponse,
            requestId: event.data.tipId,
            name: 'tip.chat.completed',
          }),
        },
      ).catch((e) => {
        console.error(e)
      })
    })

    return {tip, messages: [...event.data.messages, aiResponse]}
  },
)
