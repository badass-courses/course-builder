import { ParagraphSchema, WordSchema } from '@/lib/srt-processor'
import { z } from 'zod'

export const DEEPGRAM_WEBHOOK_EVENT = 'deepgram/web-hook-event'

export type VideoDeepgramWebhook = {
  name: typeof DEEPGRAM_WEBHOOK_EVENT
  data: DeepgramWebhookEvent
}

export const DeepgramResultsSchema = z.object({
  channels: z.array(
    z.object({
      alternatives: z.array(
        z.object({
          transcript: z.string(),
          paragraphs: z
            .object({
              paragraphs: z.array(ParagraphSchema),
            })
            .optional(),
          words: z.array(WordSchema),
        }),
      ),
    }),
  ),
})

export type DeepgramResults = z.infer<typeof DeepgramResultsSchema>

export const DeepgramWebhookEventSchema = z.object({
  videoResourceId: z.string().nullable(),
  moduleSlug: z.string().nullable(),
  results: DeepgramResultsSchema,
})

export type DeepgramWebhookEvent = z.infer<typeof DeepgramWebhookEventSchema>
