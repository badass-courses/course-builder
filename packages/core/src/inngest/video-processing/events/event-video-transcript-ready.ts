import { z } from 'zod'

export const VIDEO_TRANSCRIPT_READY_EVENT = 'video/transcript-ready-event'

export type EventVideoTranscriptReady = {
  name: typeof VIDEO_TRANSCRIPT_READY_EVENT
  data: VideoTranscriptReadyEvent
}

export const VideoTranscriptReadyEventSchema = z.object({
  videoResourceId: z.string().nullable(),
  moduleSlug: z.string().nullable(),
  results: z.any(),
  srt: z.string(),
  wordLevelSrt: z.string(),
  transcript: z.string(),
})

export type VideoTranscriptReadyEvent = z.infer<
  typeof VideoTranscriptReadyEventSchema
>
