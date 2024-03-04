import { TIP_CHAT_EVENT } from '@/inngest/events'
import { resourceChat } from '@/inngest/helpers/resource-chat'
import { inngest } from '@/inngest/inngest.server'
import { getTip } from '@/lib/tips-query'
import { NonRetriableError } from 'inngest'

/**
 * TODO: Cancellation conditions need to be added $$
 */
export const tipChat = inngest.createFunction(
  {
    id: `tip-chat`,
    name: 'Tip Chat',
    rateLimit: {
      key: 'event.user.id',
      limit: 5,
      period: '15s',
    },
  },
  {
    event: TIP_CHAT_EVENT,
  },
  async ({ event, step }) => {
    const tip = await step.run(`load tip`, async () => {
      return await getTip(event.data.tipId)
    })

    if (!tip) {
      throw new NonRetriableError(`Tip not found for id (${event.data.tipId})`)
    }

    const resourceId = tip._id
    const workflowTrigger = event.data.selectedWorkflow || 'tip-chat-response'

    const messages = await resourceChat({
      step,
      workflowTrigger,
      resourceId,
      resource: tip,
      messages: event.data.messages,
      currentFeedback: event.data.currentFeedback,
      session: event.data.session,
    })

    return { tip, messages }
  },
)
