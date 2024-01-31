import { inngest } from "@/inngest/inngest.server";
import { ARTICLE_CHAT_EVENT } from "@/inngest/events";

import { streamingChatPromptExecutor } from "@/lib/streaming-chat-prompt-executor";
import { env } from "@/env.mjs";
import { sanityQuery } from "@/server/sanity.server";
import type { ChatCompletionRequestMessage } from "openai-edge";
import { promptActionExecutor } from "@/lib/prompt.action-executor";
import { Liquid } from "liquidjs";
import { getArticle } from "@/lib/articles";
import { NonRetriableError } from "inngest";
import { resourceChat } from "@/inngest/helpers/resource-chat";

export const articleChat = inngest.createFunction(
  {
    id: `article-chat`,
    name: "Article Chat",
  },
  {
    event: ARTICLE_CHAT_EVENT,
  },
  async ({ event, step }) => {
    const article = await step.run(`load article`, async () => {
      return await getArticle(event.data.articleId);
    });

    if (!article) {
      throw new NonRetriableError(`Article ${event.data.articleId} not found`);
    }

    const resource = { article };
    const resourceId = article._id;
    const workflowTrigger = ARTICLE_CHAT_EVENT;

    const messages = await resourceChat({
      step,
      workflowTrigger,
      resourceId,
      resource,
      messages: event.data.messages,
      currentFeedback: event.data.currentFeedback,
    });

    return { article, messages };
  },
);
