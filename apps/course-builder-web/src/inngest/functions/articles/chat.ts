import { env } from '@/env.mjs'
import { ARTICLE_CHAT_EVENT } from '@/inngest/events'
import { resourceChat } from '@/inngest/helpers/resource-chat'
import { inngest } from '@/inngest/inngest.server'
import { getArticle } from '@/lib/articles'
import { promptActionExecutor } from '@/lib/prompt.action-executor'
import { streamingChatPromptExecutor } from '@/lib/streaming-chat-prompt-executor'
import { sanityQuery } from '@/server/sanity.server'
import { NonRetriableError } from 'inngest'
import { Liquid } from 'liquidjs'
import type { ChatCompletionRequestMessage } from 'openai-edge'

export const articleChat = inngest.createFunction(
  {
    id: `article-chat`,
    name: 'Article Chat',
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
