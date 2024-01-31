import { inngest } from "@/inngest/inngest.server";
import { ARTICLE_CHAT_EVENT, TIP_CHAT_EVENT } from "@/inngest/events";

import { getTip } from "@/lib/tips";
import { streamingChatPromptExecutor } from "@/lib/streaming-chat-prompt-executor";
import { env } from "@/env.mjs";
import { sanityQuery } from "@/server/sanity.server";
import type { ChatCompletionRequestMessage } from "openai-edge";
import { promptActionExecutor } from "@/lib/prompt.action-executor";
import { Liquid } from "liquidjs";
import { NonRetriableError } from "inngest";
import { resourceChat } from "@/inngest/helpers/resource-chat";

/**
 * TODO: Cancellation conditions need to be added $$
 */
export const tipChat = inngest.createFunction(
  {
    id: `tip-chat`,
    name: "Tip Chat",
  },
  {
    event: TIP_CHAT_EVENT,
  },
  async ({ event, step }) => {
    const tip = await step.run(`load tip`, async () => {
      return await getTip(event.data.tipId);
    });

    if (!tip) {
      throw new NonRetriableError(`Tip not found for id (${event.data.tipId})`);
    }

    const resource = { tip };
    const resourceId = tip._id;
    const workflowTrigger = TIP_CHAT_EVENT;

    const messages = await resourceChat({
      step,
      workflowTrigger,
      resourceId,
      resource,
      messages: event.data.messages,
      currentFeedback: event.data.currentFeedback,
    });

    return { tip, messages };
  },
);
