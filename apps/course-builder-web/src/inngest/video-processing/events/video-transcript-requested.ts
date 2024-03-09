import { z } from 'zod'

export const VIDEO_TRANSCRIPT_READY_EVENT = 'video/transcript-ready'

export type VideoTranscriptReady = {
  name: typeof VIDEO_TRANSCRIPT_READY_EVENT
  data: VideoReadyEvent
}

export const VideoTranscriptReadyEventSchema = z.object({
  videoResourceId: z.string().nullable(),
  srt: z.string(),
  transcript: z.string(),
  moduleSlug: z.string().nullable(),
})

export type VideoReadyEvent = z.infer<typeof VideoTranscriptReadyEventSchema>
