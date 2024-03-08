import { ARTICLE_CHAT_EVENT } from '@/inngest/events'
import { resourceChat } from '@/inngest/helpers/resource-chat'
import { inngest } from '@/inngest/inngest.server'
import { getArticle } from '@/lib/articles-query'
import { NonRetriableError } from 'inngest'

export const articleChat = inngest.createFunction(
  {
    id: `article-chat`,
    name: 'Article Chat',
    rateLimit: {
      key: 'event.user.id',
      limit: 5,
      period: '15s',
    },
  },
  {
    event: ARTICLE_CHAT_EVENT,
  },
  async ({ event, step }) => {
    const article = await step.run(`load article`, async () => {
      return await getArticle(event.data.articleId)
    })

    if (!article) {
      throw new NonRetriableError(`Article ${event.data.articleId} not found`)
    }

    const resourceId = article._id
    const workflowTrigger = ARTICLE_CHAT_EVENT

    const messages = await resourceChat({
      step,
      workflowTrigger,
      resourceId,
      resource: article,
      messages: event.data.messages,
      currentFeedback: event.data.currentFeedback,
      session: event.data.session,
    })

    return { article, messages }
  },
)
