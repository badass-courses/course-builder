import { ParagraphSchema, WordSchema } from '@/lib/srt-processor'
import { z } from 'zod'

export const VIDEO_TRANSCRIPT_READY_EVENT = 'video/transcript-ready-event'

export type VideoTranscriptReady = {
  name: typeof VIDEO_TRANSCRIPT_READY_EVENT
  data: VideoTranscriptReadyEvent
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

export const VideoTranscriptReadyEventSchema = z.object({
  videoResourceId: z.string().nullable(),
  moduleSlug: z.string().nullable(),
  results: DeepgramResultsSchema,
})

export type VideoTranscriptReadyEvent = z.infer<typeof VideoTranscriptReadyEventSchema>
