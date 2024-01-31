import { inngest } from "@/inngest/inngest.server";
import { BODY_TEXT_UPDATED } from "@/inngest/events";

import { env } from "@/env.mjs";
import { FeedbackMarkerSchema } from "@/lib/feedback-marker";
import { z } from "zod";

export const generateFeedbackMarkers = inngest.createFunction(
  {
    id: `generate-feedback-markers`,
    name: "Generate Feedback Markers",
    idempotency: "event.id",
    debounce: {
      key: "event.data.resourceId",
      period: "15s",
    },
  },
  { event: BODY_TEXT_UPDATED },
  async ({ event, step }) => {
    const markers = await step.run("Generate Feedback Markers", async () => {
      return fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              content: `## Generate Feedback Markers JSON Array
              
              You are a technical editor providing feedback to a developer that is writing for other developers.
              
              They will provide you with an array in json where each item in the array is a line of text from their writing. **The line number corresponds to the item's index in the array.** Blank lines are an empty string, but must be counted.
              
              Look at each line of text and provide feedback on the grammar, spelling, and punctuation wherever it can be improved.
              
              An JSON array of markers should be returned.
              
              ## Instructions
              
              * Line number accuracy is CRITICAL.
              * as appropriate, feedback can extend to multiple lines
              * Columns are individual characters on a single line and represent the start and finish of a selected span. 
              * return an ARRAY of objects using the template, even if it is only one feedback marker.
              * multiple feedback markers can be provided.
              * remove feedback that has been addressed
              * don't waste our time with feedback that is not actionable
              * harsh feedback is OK, no need to spare our feelings
              * act like the authority that you are
              * do keep the feedback premium and useful
              * do exclude feedback that is marginal or not actionable
              * focus on ideas over grammar
              * limit the feedback to the the top three issues
              
              ## Feedback Marker Zod Schema
              
              const FeedbackMarkerSchema = z.object({
                originalText: z.string(),
                feedback: z.string(),
                fullSuggestedChange: z.string(),
                level: z.string(),
                type: z.string(),
              })

              ## Feedback Marker example   
              
              const FeedbackMarkerSchemaExample = {
                originalText: 'You are mistaken my good sir, this is not the way to do it.',
                feedback: 'This sentence is old-timey sounding and corny.',
                fullSuggestedChange: 'The replacement text that captures the feedback meaningfully.',
                level: 'critical',
                type: 'grammar',
              }
              
              ## Current Feedback to Verify and Update
              
              ${JSON.stringify(event.data.currentFeedback)}
              
              ## Template\n\n{markers:[{"originalText": "quoted from the text", "feedback": "useful feedback", "fullSuggestedChange": "rewritten text that captures the feedback meaningfully", "level": "how much attention is needed?", "type": "a single word that describes the type of change"}]}`,
              role: "system",
            },
            {
              content: JSON.stringify(event.data.content?.split("\n")),
              role: "user",
            },
          ],
          model: "gpt-4-1106-preview",
          response_format: { type: "json_object" },
        }),
      })
        .then((response) => response.json())
        .then((response) => {
          return z
            .array(FeedbackMarkerSchema)
            .parse(JSON.parse(response.choices[0].message.content).markers);
        })
        .catch((e) => {
          console.error(e);
          return [];
        });
    });

    await step.run("Broadcast Completion", async () => {
      await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${event.data.resourceId}`,
        {
          method: "POST",
          body: JSON.stringify({
            body: markers,
            name: "ai.feedback.markers.generated",
            requestId: event.data.resourceId,
          }),
        },
      ).catch((e) => {
        console.error(e);
      });
    });

    return markers;
  },
);
