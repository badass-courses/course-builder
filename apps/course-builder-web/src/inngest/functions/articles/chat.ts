import {inngest} from '@/inngest/inngest.server'
import {ARTICLE_CHAT_EVENT, TIP_CHAT_EVENT} from '@/inngest/events'

import {getTip} from '@/lib/tips'
import {promptStep} from '@/lib/prompt-step'
import {env} from '@/env.mjs'
import {sanityQuery} from '@/server/sanity.server'
import type {ChatCompletionRequestMessage} from 'openai-edge'
import {promptActionExecutor} from '@/lib/prompt.action-executor'
import {Liquid} from 'liquidjs'
import {getArticle} from '@/lib/articles'

export const articleChat = inngest.createFunction(
  {
    id: `article-chat`,
    name: 'Article Chat',
  },
  {
    event: ARTICLE_CHAT_EVENT,
  },
  async ({event, step}) => {
    const article = await step.run(`load article`, async () => {
      return await getArticle(event.data.articleId)
    })

    if (!article) {
      throw new Error(`Article ${event.data.articleId} not found`)
    }

    const workflow = await step.run('Load Workflow', async () => {
      return await sanityQuery(
        `*[_type == "workflow" && trigger == "${ARTICLE_CHAT_EVENT}"][0]`,
        {useCdn: false},
      )
    })

    let messages: ChatCompletionRequestMessage[] = event.data.messages

    const systemPromptAction = workflow.actions.find(
      (action: {_type: string; role: string}) =>
        action._type === 'prompt' && action.role === 'system',
    )

    console.log(systemPromptAction)

    const systemPrompt = await step.run(`parse system prompt`, async () => {
      try {
        const engine = new Liquid()
        return {
          role: systemPromptAction.role,
          content: await engine.parseAndRender(systemPromptAction.content, {
            article,
          }),
        }
      } catch (e: any) {
        console.error(e.message)
        return {
          role: systemPromptAction.role,
          content: systemPromptAction.content,
        }
      }
    })

    if (messages.length === 1 && systemPrompt) {
      messages = [systemPrompt, ...messages]
    }

    const systemPromptIndex = workflow.actions.findIndex(
      (item: any) =>
        item.content === systemPrompt.content &&
        item.role === systemPrompt.role,
    )

    workflow.actions.splice(systemPromptIndex, 1)

    messages = await step.run('answer the user prompt', async () => {
      const currentUserMessage = messages[messages.length - 1]
      if (!currentUserMessage) {
        throw new Error('No user message')
      }
      const engine = new Liquid()
      currentUserMessage.content = await engine.parseAndRender(
        currentUserMessage.content ?? '',
        {
          article,
        },
      )
      return promptStep({
        requestId: event.data.articleId,
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
              input: {
                article,
              },
              requestId: article._id,
              messages,
            })
          })
          break
        default:
          shouldContinue = false
      }
    }

    await step.run('partykit broadcast', async () => {
      return await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${event.data.articleId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: messages,
            requestId: event.data.articleId,
            name: 'article.chat.completed',
          }),
        },
      )
        .then((res) => {
          return res.text()
        })
        .catch((e) => {
          console.error(e)
        })
    })

    return {article, messages}
  },
)
