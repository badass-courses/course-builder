import {z} from "zod";

export const TRANSCRIPT_REQUESTED_EVENT = 'transcript/transcript-requested'

export type TranscriptRequested = {
  name: typeof TRANSCRIPT_REQUESTED_EVENT
  data: TranscriptRequestedEvent
}

export const TranscriptRequestedEventSchema = z.object({
  videoResourceId: z.string(),
  mediaUrl: z.string(),
})

export type TranscriptRequestedEvent = z.infer<typeof TranscriptRequestedEventSchema>

export const TRANSCRIPT_READY_EVENT = 'transcript/transcript-ready'

export type TranscriptReady = {
  name: typeof TRANSCRIPT_READY_EVENT
  data: TranscriptReadyEvent
}

export const TranscriptReadyEventSchema = z.object({
  videoResourceId: z.string().nullable(),
  srt: z.string(),
  transcript: z.string(),
})

export type TranscriptReadyEvent = z.infer<typeof TranscriptReadyEventSchema>